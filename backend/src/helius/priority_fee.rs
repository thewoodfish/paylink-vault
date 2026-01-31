use serde_json::json;

use crate::{config::Config, error::AppError};

pub async fn get_priority_fee_estimate(
    client: &reqwest::Client,
    config: &Config,
    serialized_tx: Option<String>,
    account_keys: Option<Vec<String>>,
) -> Result<serde_json::Value, AppError> {
    let base = crate::helius::base_url(config);
    let url = format!("{}/?api-key={}", base, config.helius_api_key);

    let mut params = serde_json::Map::new();
    if let Some(tx) = serialized_tx {
        params.insert("transaction".to_string(), json!(tx));
    }
    if let Some(keys) = account_keys {
        params.insert("accountKeys".to_string(), json!(keys));
    }

    let body = json!({
        "jsonrpc": "2.0",
        "id": "priority-fee",
        "method": "getPriorityFeeEstimate",
        "params": [params]
    });

    let resp = client.post(url).json(&body).send().await?;
    let value: serde_json::Value = resp.json().await?;
    Ok(value)
}
