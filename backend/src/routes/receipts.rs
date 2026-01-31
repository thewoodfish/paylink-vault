use axum::{extract::{Path, Query, State}, response::IntoResponse, routing::{get, post}, Json, Router};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{app::AppState, db::queries, error::AppError, helius::enhanced_tx, privacy::types::CommitmentPayload, util::crypto};

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub merchant: Option<String>,
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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyReceiptRequest {
    pub proof: VerifyProof,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyProof {
    pub commitment: String,
    pub nonce: String,
    pub revealed: RevealedFields,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RevealedFields {
    pub paylink_id: Option<Uuid>,
    pub merchant_pubkey: Option<String>,
    pub amount: Option<i64>,
    pub mint: Option<String>,
    pub slot: Option<i64>,
    pub invoice_ref: Option<String>,
}

impl RevealedFields {
    fn as_matched_fields(&self) -> Vec<String> {
        let mut out = Vec::new();
        if self.paylink_id.is_some() {
            out.push("paylinkId".to_string());
        }
        if self.merchant_pubkey.is_some() {
            out.push("merchantPubkey".to_string());
        }
        if self.amount.is_some() {
            out.push("amount".to_string());
        }
        if self.mint.is_some() {
            out.push("mint".to_string());
        }
        if self.slot.is_some() {
            out.push("slot".to_string());
        }
        if self.invoice_ref.is_some() {
            out.push("invoiceRef".to_string());
        }
        out
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyReceiptResponse {
    pub verified: bool,
    pub reason: String,
    pub details: Option<VerifyDetails>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyDetails {
    pub paylink_id: Option<Uuid>,
    pub merchant_pubkey: Option<String>,
    pub amount: Option<i64>,
    pub mint: Option<String>,
    pub slot: Option<i64>,
    pub paid_signature: Option<String>,
    pub matched_fields: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceiptFieldPolicy {
    pub merchant: bool,
    pub amount: bool,
    pub token: bool,
    pub time_window: bool,
    pub invoice_ref: bool,
    pub paylink_id: bool,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_receipts))
        .route("/:id", get(get_receipt))
        .route("/:id/proof", post(get_receipt_proof))
        .route("/verify", post(verify_receipt))
}

async fn list_receipts(
    State(state): State<AppState>,
    Query(query): Query<ListQuery>,
) -> Result<impl IntoResponse, AppError> {
    let page = query.page.unwrap_or(1).max(1);
    let page_size = 20;
    let (items, total) = queries::list_receipts_by_merchant(
        &state.db,
        query.merchant,
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

async fn get_receipt(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let receipt = queries::get_receipt(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("receipt not found".to_string()))?;

    let mut facts = receipt.facts.clone();
    if let Some(obj) = facts.as_object_mut() {
        obj.remove("nonce");
    }

    Ok(Json(serde_json::json!({
        "receipt": {
            "id": receipt.id,
            "paylinkId": receipt.paylink_id,
            "commitment": receipt.commitment,
            "issuedAt": receipt.issued_at,
            "facts": facts,
            "rail": receipt.rail,
        }
    })))
}

async fn verify_receipt(
    State(state): State<AppState>,
    Json(payload): Json<VerifyReceiptRequest>,
) -> Result<impl IntoResponse, AppError> {
    let commitment_payload = CommitmentPayload {
        paylink_id: payload.proof.revealed.paylink_id,
        merchant_pubkey: payload.proof.revealed.merchant_pubkey.clone(),
        amount: payload.proof.revealed.amount,
        mint: payload.proof.revealed.mint.clone(),
        slot: payload.proof.revealed.slot,
        invoice_ref: payload.proof.revealed.invoice_ref.clone(),
        nonce: payload.proof.nonce.clone(),
    };
    let bytes = serde_json::to_vec(&commitment_payload)
        .map_err(|e| AppError::BadRequest(format!("invalid proof: {}", e)))?;
    let commitment = crypto::sha256_hex(&bytes);

    if commitment != payload.proof.commitment {
        if let Some(receipt) = queries::get_receipt_by_commitment(&state.db, &payload.proof.commitment).await? {
            let stored_nonce = receipt
                .facts
                .get("nonce")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            if stored_nonce == Some(payload.proof.nonce.clone()) {
                let matched_fields = payload.proof.revealed.as_matched_fields();
                return Ok(Json(VerifyReceiptResponse {
                    verified: true,
                    reason: "receipt found".to_string(),
                    details: Some(VerifyDetails {
                        paylink_id: Some(receipt.paylink_id),
                        merchant_pubkey: receipt
                            .facts
                            .get("merchantPubkey")
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string()),
                        amount: receipt.facts.get("amount").and_then(|v| v.as_i64()),
                        mint: receipt
                            .facts
                            .get("mint")
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string()),
                        slot: receipt.facts.get("slot").and_then(|v| v.as_i64()),
                        paid_signature: None,
                        matched_fields,
                    }),
                }));
            }
        }

        return Ok(Json(VerifyReceiptResponse {
            verified: false,
            reason: "commitment mismatch".to_string(),
            details: None,
        }));
    }

    if let Some(receipt) = queries::get_receipt_by_commitment(&state.db, &commitment).await? {
        let paylink = queries::get_paylink(&state.db, receipt.paylink_id).await?;
        let paid_signature = paylink.and_then(|p| p.paid_signature);
        return Ok(Json(VerifyReceiptResponse {
            verified: true,
            reason: "receipt found".to_string(),
            details: Some(VerifyDetails {
                paylink_id: Some(receipt.paylink_id),
                merchant_pubkey: receipt
                    .facts
                    .get("merchantPubkey")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
                amount: receipt.facts.get("amount").and_then(|v| v.as_i64()),
                mint: receipt
                    .facts
                    .get("mint")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
                slot: receipt.facts.get("slot").and_then(|v| v.as_i64()),
                paid_signature,
                matched_fields: vec!["commitment".to_string()],
            }),
        }));
    }

    if let Some(paylink_id) = payload.proof.revealed.paylink_id {
        if let Some(paylink) = queries::get_paylink(&state.db, paylink_id).await? {
            if let Some(signature) = paylink.paid_signature.clone() {
                let tx = enhanced_tx::fetch_enhanced_tx(&state.http, &state.config, &signature).await?;
                let rail = state.rail.active();
                let result = rail.verify_payment(&paylink, &tx).await;
                return Ok(Json(VerifyReceiptResponse {
                    verified: result.matched,
                    reason: result.reason,
                    details: Some(VerifyDetails {
                        paylink_id: Some(paylink.id),
                        merchant_pubkey: Some(paylink.merchant_pubkey),
                        amount: Some(paylink.expected_amount),
                        mint: Some(paylink.mint),
                        slot: paylink.paid_slot,
                        paid_signature: Some(signature),
                        matched_fields: result.matched_fields,
                    }),
                }));
            }
        }
    }

    Ok(Json(VerifyReceiptResponse {
        verified: false,
        reason: "receipt not found".to_string(),
        details: None,
    }))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProofRequest {
    pub disclosed: ReceiptFieldPolicy,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProofResponse {
    pub proof: serde_json::Value,
}

async fn get_receipt_proof(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<ProofRequest>,
) -> Result<impl IntoResponse, AppError> {
    let receipt = queries::get_receipt(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("receipt not found".to_string()))?;

    let nonce = receipt
        .facts
        .get("nonce")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::Other("nonce not available".to_string()))?
        .to_string();

    let facts = &receipt.facts;
    let revealed = serde_json::json!({
        "paylinkId": if payload.disclosed.paylink_id { Some(receipt.paylink_id) } else { None },
        "merchantPubkey": if payload.disclosed.merchant { facts.get("merchantPubkey").and_then(|v| v.as_str()) } else { None },
        "amount": if payload.disclosed.amount { facts.get("amount").and_then(|v| v.as_i64()) } else { None },
        "mint": if payload.disclosed.token { facts.get("mint").and_then(|v| v.as_str()) } else { None },
        "slot": if payload.disclosed.time_window { facts.get("slot").and_then(|v| v.as_i64()) } else { None },
        "invoiceRef": if payload.disclosed.invoice_ref { facts.get("invoiceRef").and_then(|v| v.as_str()) } else { None },
    });

    Ok(Json(ProofResponse {
        proof: serde_json::json!({
            "commitment": receipt.commitment,
            "nonce": nonce,
            "revealed": revealed
        }),
    }))
}
