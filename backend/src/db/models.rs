use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct PayLink {
    pub id: Uuid,
    pub merchant_pubkey: String,
    pub expected_amount: i64,
    pub mint: String,
    pub expires_at: DateTime<Utc>,
    pub invoice_ref: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub paid_signature: Option<String>,
    pub paid_slot: Option<i64>,
    pub privacy_rail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Receipt {
    pub id: Uuid,
    pub paylink_id: Uuid,
    pub commitment: String,
    pub issued_at: DateTime<Utc>,
    pub facts: serde_json::Value,
    pub rail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ActivityEvent {
    pub id: i64,
    pub paylink_id: Uuid,
    pub r#type: String,
    pub at: DateTime<Utc>,
    pub detail: serde_json::Value,
}
