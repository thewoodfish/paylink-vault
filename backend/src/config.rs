use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub port: u16,
    pub helius_api_key: String,
    pub helius_cluster: String,
    pub webhook_secret: Option<String>,
    pub cors_origins: Vec<String>,
    pub base_pay_url: String,
    pub privacy_rail: String,
}

impl Config {
    pub fn from_env() -> Self {
        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/receiptless".to_string());
        let port = env::var("PORT")
            .ok()
            .and_then(|v| v.parse::<u16>().ok())
            .unwrap_or(8080);
        let helius_api_key = env::var("HELIUS_API_KEY").unwrap_or_default();
        let helius_cluster = env::var("HELIUS_CLUSTER").unwrap_or_else(|_| "devnet".to_string());
        let webhook_secret = env::var("WEBHOOK_SECRET").ok();
        let cors_origins = env::var("CORS_ORIGINS")
            .unwrap_or_else(|_| "http://localhost:3000".to_string())
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
        let base_pay_url = env::var("BASE_PAY_URL")
            .unwrap_or_else(|_| "http://localhost:3000".to_string());
        let privacy_rail = env::var("PRIVACY_RAIL").unwrap_or_else(|_| "transparent".to_string());

        Self {
            database_url,
            port,
            helius_api_key,
            helius_cluster,
            webhook_secret,
            cors_origins,
            base_pay_url,
            privacy_rail,
        }
    }
}
