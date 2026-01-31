mod app;
mod config;
mod db;
mod error;
mod helius;
mod privacy;
mod routes;
mod util;

use app::{AppState};
use dotenvy::dotenv;

#[tokio::main]
async fn main() -> Result<(), error::AppError> {
    dotenv().ok();

    let config = config::Config::from_env();
    let db = db::connect(&config.database_url).await?;
    sqlx::migrate!("./migrations").run(&db).await?;

    let http = reqwest::Client::new();
    let rail = privacy::rail::RailSelector::new(&config.privacy_rail);

    let state = AppState {
        db,
        http,
        config,
        rail,
    };

    app::run(state).await
}
