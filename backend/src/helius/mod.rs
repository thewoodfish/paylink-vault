pub mod enhanced_tx;
pub mod priority_fee;

use crate::config::Config;

pub fn base_url(config: &Config) -> String {
    match config.helius_cluster.as_str() {
        "mainnet" => "https://api-mainnet.helius-rpc.com".to_string(),
        _ => "https://api-devnet.helius-rpc.com".to_string(),
    }
}
