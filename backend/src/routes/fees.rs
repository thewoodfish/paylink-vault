use axum::{extract::State, response::IntoResponse, routing::post, Json, Router};
use serde::{Deserialize, Serialize};

use crate::{app::AppState, error::AppError, helius::priority_fee};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PriorityFeeRequest {
    pub transaction: Option<TransactionInfo>,
    pub accounts: Option<AccountsInfo>,
    pub level: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransactionInfo {
    pub serialized_tx_base64: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountsInfo {
    pub account_keys: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PriorityFeeResponse {
    pub levels: serde_json::Value,
    pub unit: String,
    pub recommended: i64,
}

pub fn router() -> Router<AppState> {
    Router::new().route("/priority-estimate", post(priority_estimate))
}

async fn priority_estimate(
    State(state): State<AppState>,
    Json(payload): Json<PriorityFeeRequest>,
) -> Result<impl IntoResponse, AppError> {
    let serialized = payload
        .transaction
        .and_then(|t| t.serialized_tx_base64);
    let account_keys = payload.accounts.and_then(|a| a.account_keys);

    let value = priority_fee::get_priority_fee_estimate(
        &state.http,
        &state.config,
        serialized,
        account_keys,
    )
    .await?;

    let (levels, recommended) = parse_priority_fee(&value);

    Ok(Json(PriorityFeeResponse {
        levels,
        unit: "microLamportsPerCU".to_string(),
        recommended,
    }))
}

fn parse_priority_fee(value: &serde_json::Value) -> (serde_json::Value, i64) {
    let levels = value
        .get("result")
        .and_then(|v| v.get("priorityFeeEstimate"))
        .cloned()
        .unwrap_or_else(|| serde_json::json!({"low":1000,"medium":2000,"high":5000}));

    let recommended = value
        .get("result")
        .and_then(|v| v.get("priorityFeeEstimate"))
        .and_then(|v| v.get("medium"))
        .and_then(|v| v.as_i64())
        .unwrap_or(2000);

    (levels, recommended)
}
