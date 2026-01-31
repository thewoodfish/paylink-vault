use axum::{extract::State, http::HeaderMap, Json};
use serde_json::Value;
use uuid::Uuid;

use crate::{
    app::AppState,
    db::{models::Receipt, queries},
    error::AppError,
    helius::enhanced_tx,
    privacy::types::CommitmentPayload,
    util::{crypto, json_scan},
};

pub async fn handle(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, AppError> {
    if let Some(secret) = &state.config.webhook_secret {
        let provided = headers
            .get("x-webhook-secret")
            .and_then(|v| v.to_str().ok());
        if provided != Some(secret.as_str()) {
            return Err(AppError::Unauthorized("invalid webhook secret".to_string()));
        }
    }

    let signatures = json_scan::scan_base58_strings(&payload);
    if signatures.is_empty() {
        return Ok(Json(serde_json::json!({"ok": true})));
    }

    for signature in signatures {
        let payload_clone = payload.clone();
        let state_clone = state.clone();
        tokio::spawn(async move {
            if let Err(err) = process_signature(state_clone, signature, payload_clone).await {
                eprintln!("webhook processing error: {:?}", err);
            }
        });
    }

    Ok(Json(serde_json::json!({"ok": true})))
}

async fn process_signature(
    state: AppState,
    signature: String,
    payload: Value,
) -> Result<(), AppError> {
    let inserted = queries::insert_webhook_event(&state.db, &signature, &payload).await?;
    if !inserted {
        return Ok(());
    }

    let tx = enhanced_tx::fetch_enhanced_tx(&state.http, &state.config, &signature).await?;
    let rail = state.rail.active();

    let paylink_id = match rail.match_paylink(&tx, &state.db).await {
        Some(id) => id,
        None => return Ok(()),
    };

    queries::insert_activity_event(
        &state.db,
        paylink_id,
        "WEBHOOK_RECEIVED",
        serde_json::json!({"signature": signature, "raw": tx.raw}),
    )
    .await?;

    let paylink = match queries::get_paylink(&state.db, paylink_id).await? {
        Some(p) => p,
        None => return Ok(()),
    };

    let verify = rail.verify_payment(&paylink, &tx).await;
    if verify.matched {
        queries::insert_activity_event(
            &state.db,
            paylink_id,
            "TX_VERIFIED_MATCH",
            serde_json::json!({"signature": signature, "matchedFields": verify.matched_fields}),
        )
        .await?;
    } else {
        queries::insert_activity_event(
            &state.db,
            paylink_id,
            "TX_VERIFIED_MISMATCH",
            serde_json::json!({"signature": signature, "reason": verify.reason}),
        )
        .await?;
        return Ok(());
    }

    let mut dbtx = state.db.begin().await?;
    let updated = queries::mark_paylink_paid(&mut dbtx, paylink_id, &signature, tx.slot).await?;
    let paylink = match updated {
        Some(p) => p,
        None => {
            dbtx.commit().await?;
            return Ok(());
        }
    };

    let existing_receipt = queries::get_receipt_by_paylink(&state.db, paylink_id).await?;
    if existing_receipt.is_none() {
        let nonce = crypto::random_nonce_hex();
        let slot = tx.slot.unwrap_or(0);
        let facts = serde_json::json!({
            "merchantPubkey": paylink.merchant_pubkey,
            "amount": paylink.expected_amount,
            "mint": paylink.mint,
            "slot": slot,
            "invoiceRef": paylink.invoice_ref,
            "nonce": nonce,
        });
        let commitment_payload = CommitmentPayload {
            paylink_id: Some(paylink.id),
            merchant_pubkey: facts.get("merchantPubkey").and_then(|v| v.as_str()).map(|s| s.to_string()),
            amount: facts.get("amount").and_then(|v| v.as_i64()),
            mint: facts.get("mint").and_then(|v| v.as_str()).map(|s| s.to_string()),
            slot: facts.get("slot").and_then(|v| v.as_i64()),
            invoice_ref: facts.get("invoiceRef").and_then(|v| v.as_str()).map(|s| s.to_string()),
            nonce: nonce.clone(),
        };
        let bytes = serde_json::to_vec(&commitment_payload)
            .map_err(|e| AppError::Other(format!("commitment serialize failed: {}", e)))?;
        let commitment = crypto::sha256_hex(&bytes);

        let receipt = Receipt {
            id: Uuid::new_v4(),
            paylink_id: paylink.id,
            commitment,
            issued_at: chrono::Utc::now(),
            facts,
            rail: paylink.privacy_rail,
        };
        queries::insert_receipt(&state.db, &receipt).await?;
        queries::insert_activity_event(
            &state.db,
            paylink_id,
            "RECEIPT_ISSUED",
            serde_json::json!({"receiptId": receipt.id, "commitment": receipt.commitment}),
        )
        .await?;
    }

    queries::insert_activity_event(
        &state.db,
        paylink_id,
        "PAYLINK_MARKED_PAID",
        serde_json::json!({"signature": signature, "slot": tx.slot}),
    )
    .await?;

    dbtx.commit().await?;
    Ok(())
}
