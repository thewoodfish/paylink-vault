use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceiptFacts {
    pub merchant_pubkey: String,
    pub amount: i64,
    pub mint: String,
    pub slot: i64,
    pub invoice_ref: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitmentPayload {
    pub paylink_id: Option<Uuid>,
    pub merchant_pubkey: Option<String>,
    pub amount: Option<i64>,
    pub mint: Option<String>,
    pub slot: Option<i64>,
    pub invoice_ref: Option<String>,
    pub nonce: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaymentMatchResult {
    pub matched: bool,
    pub reason: String,
    pub matched_fields: Vec<String>,
}
