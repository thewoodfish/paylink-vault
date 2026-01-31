use axum::{extract::{Path, Query, State}, response::IntoResponse, routing::{get, post}, Json, Router};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{app::AppState, db::{models::PayLink, queries}, error::AppError};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoPolicy {
    pub enabled: bool,
    pub template: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceiptFieldsPolicy {
    pub merchant: bool,
    pub amount: bool,
    pub token: bool,
    pub time_window: bool,
    pub invoice_ref: bool,
    pub paylink_id: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePaylinkRequest {
    pub merchant_pubkey: String,
    pub expected_amount: i64,
    pub mint: String,
    pub expires_at: DateTime<Utc>,
    pub invoice_ref: Option<String>,
    pub memo_policy: MemoPolicy,
    pub receipt_fields_policy: ReceiptFieldsPolicy,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePaylinkResponse {
    pub paylink: PayLink,
    pub pay_url: String,
    pub privacy_rail: String,
}

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub status: Option<String>,
    pub token: Option<String>,
    pub q: Option<String>,
    pub page: Option<i64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ListResponse<T> {
    pub items: Vec<T>,
    pub page: i64,
    pub page_size: i64,
    pub total: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaylinkResponse {
    pub paylink: PayLink,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityEventResponse {
    pub events: Vec<ActivityEventItem>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityEventItem {
    pub r#type: String,
    pub at: DateTime<Utc>,
    pub detail: serde_json::Value,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", post(create_paylink).get(list_paylinks))
        .route("/:id", get(get_paylink))
        .route("/:id/activity", get(get_activity))
        .route("/:id/receipts", get(get_paylink_receipts))
        .route("/:id/simulate", post(simulate_paylink))
}

async fn create_paylink(
    State(state): State<AppState>,
    Json(payload): Json<CreatePaylinkRequest>,
) -> Result<impl IntoResponse, AppError> {
    let id = Uuid::new_v4();
    let now = Utc::now();
    let privacy = state.rail.active();
    let paylink = PayLink {
        id,
        merchant_pubkey: payload.merchant_pubkey,
        expected_amount: payload.expected_amount,
        mint: payload.mint,
        expires_at: payload.expires_at,
        invoice_ref: payload.invoice_ref,
        status: "pending".to_string(),
        created_at: now,
        paid_signature: None,
        paid_slot: None,
        privacy_rail: privacy.name().to_string(),
    };

    queries::insert_paylink(&state.db, &paylink).await?;
    queries::insert_activity_event(
        &state.db,
        paylink.id,
        "PAYLINK_CREATED",
        serde_json::json!({"memoPolicy": payload.memo_policy, "receiptFieldsPolicy": payload.receipt_fields_policy}),
    )
    .await?;
    queries::insert_activity_event(
        &state.db,
        paylink.id,
        "RAIL_SELECTED",
        serde_json::json!({"rail": privacy.name()}),
    )
    .await?;

    let pay_url = format!("{}/pay/{}", state.config.base_pay_url.trim_end_matches('/'), paylink.id);

    Ok((
        axum::http::StatusCode::CREATED,
        Json(CreatePaylinkResponse {
            paylink,
            pay_url,
            privacy_rail: privacy.name().to_string(),
        }),
    ))
}

async fn list_paylinks(
    State(state): State<AppState>,
    Query(query): Query<ListQuery>,
) -> Result<impl IntoResponse, AppError> {
    queries::expire_paylinks(&state.db).await?;
    let page = query.page.unwrap_or(1).max(1);
    let page_size = 20;
    let (items, total) = queries::list_paylinks(
        &state.db,
        query.status,
        query.token,
        query.q,
        page,
        page_size,
    )
    .await?;

    Ok(Json(ListResponse {
        items,
        page,
        page_size,
        total,
    }))
}

async fn get_paylink(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    queries::expire_paylink_by_id(&state.db, id).await?;
    let paylink = queries::get_paylink(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("paylink not found".to_string()))?;
    Ok(Json(PaylinkResponse { paylink }))
}

async fn get_activity(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let events = queries::list_activity_events(&state.db, id).await?;
    let items = events
        .into_iter()
        .map(|ev| ActivityEventItem {
            r#type: ev.r#type,
            at: ev.at,
            detail: ev.detail,
        })
        .collect();

    Ok(Json(ActivityEventResponse { events: items }))
}

async fn get_paylink_receipts(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let receipts = queries::list_receipts_by_paylink(&state.db, id).await?;
    let items: Vec<serde_json::Value> = receipts
        .into_iter()
        .map(|receipt| serde_json::json!({
            "id": receipt.id,
            "paylinkId": receipt.paylink_id,
            "commitment": receipt.commitment,
            "issuedAt": receipt.issued_at,
        }))
        .collect();

    Ok(Json(serde_json::json!({"items": items})))
}

async fn simulate_paylink(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let paylink = queries::get_paylink(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("paylink not found".to_string()))?;

    if paylink.status == "paid" {
        return Ok(Json(serde_json::json!({ "signature": paylink.paid_signature })));
    }

    let signature = format!("simulated-{}", Uuid::new_v4());
    let slot = 0i64;

    queries::insert_activity_event(
        &state.db,
        paylink.id,
        "WEBHOOK_RECEIVED",
        serde_json::json!({ "signature": signature }),
    )
    .await?;

    queries::insert_activity_event(
        &state.db,
        paylink.id,
        "TX_VERIFIED_MATCH",
        serde_json::json!({ "signature": signature, "matchedFields": ["memo", "amount", "mint", "merchantPubkey"] }),
    )
    .await?;

    let mut dbtx = state.db.begin().await?;
    let updated = queries::mark_paylink_paid(&mut dbtx, paylink.id, &signature, Some(slot)).await?;
    let paylink = match updated {
        Some(p) => p,
        None => {
            dbtx.commit().await?;
            return Ok(Json(serde_json::json!({ "signature": signature })));
        }
    };

    let existing_receipt = queries::get_receipt_by_paylink(&state.db, paylink.id).await?;
    if existing_receipt.is_none() {
        let nonce = crate::util::crypto::random_nonce_hex();
        let facts = serde_json::json!({
            "merchantPubkey": paylink.merchant_pubkey,
            "amount": paylink.expected_amount,
            "mint": paylink.mint,
            "slot": slot,
            "invoiceRef": paylink.invoice_ref,
            "nonce": nonce,
        });
        let commitment_payload = crate::privacy::types::CommitmentPayload {
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
        let commitment = crate::util::crypto::sha256_hex(&bytes);

        let receipt = crate::db::models::Receipt {
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
            paylink.id,
            "RECEIPT_ISSUED",
            serde_json::json!({ "receiptId": receipt.id, "commitment": receipt.commitment }),
        )
        .await?;
    }

    queries::insert_activity_event(
        &state.db,
        paylink.id,
        "PAYLINK_MARKED_PAID",
        serde_json::json!({ "signature": signature, "slot": slot }),
    )
    .await?;

    dbtx.commit().await?;

    Ok(Json(serde_json::json!({ "signature": signature })))
}
