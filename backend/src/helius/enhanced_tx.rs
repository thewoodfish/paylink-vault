use serde_json::Value;

use crate::{config::Config, error::AppError};

#[derive(Debug, Clone)]
pub struct TokenTransfer {
    pub mint: String,
    pub amount: i64,
    pub destination: String,
}

#[derive(Debug, Clone)]
pub struct NativeTransfer {
    pub lamports: i64,
    pub destination: String,
}

#[derive(Debug, Clone)]
pub struct TxView {
    pub signature: String,
    pub slot: Option<i64>,
    pub timestamp: Option<i64>,
    pub memo_strings: Vec<String>,
    pub token_transfers: Vec<TokenTransfer>,
    pub native_transfers: Vec<NativeTransfer>,
    pub raw: Value,
}

pub async fn fetch_enhanced_tx(
    client: &reqwest::Client,
    config: &Config,
    signature: &str,
) -> Result<TxView, AppError> {
    let base = crate::helius::base_url(config);
    let url = format!("{}/v0/transactions?api-key={}", base, config.helius_api_key);

    let body_a = serde_json::json!({"transactions": [signature]});
    let resp_a = client.post(&url).json(&body_a).send().await?;
    if resp_a.status().is_success() {
        let value: Value = resp_a.json().await?;
        return Ok(extract_tx_view(signature, value));
    }

    let body_b = serde_json::json!([signature]);
    let resp_b = client.post(&url).json(&body_b).send().await?;
    let value: Value = resp_b.json().await?;
    Ok(extract_tx_view(signature, value))
}

pub fn extract_tx_view(signature: &str, raw: Value) -> TxView {
    let slot = raw
        .get(0)
        .and_then(|v| v.get("slot"))
        .and_then(|v| v.as_i64())
        .or_else(|| raw.get("slot").and_then(|v| v.as_i64()));
    let timestamp = raw
        .get(0)
        .and_then(|v| v.get("timestamp"))
        .and_then(|v| v.as_i64())
        .or_else(|| raw.get("timestamp").and_then(|v| v.as_i64()));

    let memo_strings = collect_memos(&raw);
    let token_transfers = collect_token_transfers(&raw);
    let native_transfers = collect_native_transfers(&raw);

    TxView {
        signature: signature.to_string(),
        slot,
        timestamp,
        memo_strings,
        token_transfers,
        native_transfers,
        raw,
    }
}

fn collect_memos(value: &Value) -> Vec<String> {
    let mut memos = Vec::new();
    let predicate = |s: &str| s.contains("paylink:") || s.contains("paylink=");
    collect_strings(value, &mut memos, &predicate);
    memos
}

fn collect_strings<F: Fn(&str) -> bool>(value: &Value, out: &mut Vec<String>, filter: &F) {
    match value {
        Value::String(s) => {
            if filter(s) {
                out.push(s.to_string());
            }
        }
        Value::Array(arr) => {
            for v in arr {
                collect_strings(v, out, filter);
            }
        }
        Value::Object(map) => {
            for v in map.values() {
                collect_strings(v, out, filter);
            }
        }
        _ => {}
    }
}

fn collect_token_transfers(raw: &Value) -> Vec<TokenTransfer> {
    let mut out = Vec::new();
    let transfers = raw
        .get(0)
        .and_then(|v| v.get("tokenTransfers"))
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_else(|| {
            raw.get("tokenTransfers")
                .and_then(|v| v.as_array())
                .cloned()
                .unwrap_or_default()
        });

    for transfer in transfers {
        let mint = transfer
            .get("mint")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();
        let destination = transfer
            .get("toUserAccount")
            .or_else(|| transfer.get("destination"))
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();
        let amount = transfer
            .get("tokenAmount")
            .and_then(|v| {
                if let Some(s) = v.as_str() {
                    s.parse::<i64>().ok()
                } else if let Some(n) = v.as_i64() {
                    Some(n)
                } else {
                    None
                }
            })
            .unwrap_or(0);

        if !mint.is_empty() && !destination.is_empty() && amount > 0 {
            out.push(TokenTransfer {
                mint,
                amount,
                destination,
            });
        }
    }

    out
}

fn collect_native_transfers(raw: &Value) -> Vec<NativeTransfer> {
    let mut out = Vec::new();
    let transfers = raw
        .get(0)
        .and_then(|v| v.get("nativeTransfers"))
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_else(|| {
            raw.get("nativeTransfers")
                .and_then(|v| v.as_array())
                .cloned()
                .unwrap_or_default()
        });

    for transfer in transfers {
        let destination = transfer
            .get("toUserAccount")
            .or_else(|| transfer.get("destination"))
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();
        let lamports = transfer
            .get("amount")
            .and_then(|v| v.as_i64())
            .unwrap_or(0);
        if !destination.is_empty() && lamports > 0 {
            out.push(NativeTransfer {
                lamports,
                destination,
            });
        }
    }

    out
}
