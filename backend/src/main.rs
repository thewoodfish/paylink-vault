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

    println!("🚀 Starting receiptless backend...");

    let config = config::Config::from_env();
    println!("📋 Config loaded");
    println!("   Database: {}", if config.database_url.is_empty() { "❌ NOT SET" } else { "✅ SET" });
    println!("   Port: {}", config.port);
    println!("   Cluster: {}", config.helius_cluster);

    println!("🔌 Connecting to database...");
    let db = db::connect(&config.database_url).await.map_err(|e| {
        eprintln!("❌ Database connection failed: {}", e);
        e
    })?;
    println!("✅ Database connected");

    println!("🔄 Running migrations...");
    sqlx::migrate!("./migrations").run(&db).await.map_err(|e| {
        eprintln!("❌ Migration failed: {}", e);
        e
    })?;
    println!("✅ Migrations complete");

    let http = reqwest::Client::new();
    let rail = privacy::rail::RailSelector::new(&config.privacy_rail);

    let state = AppState {
        db,
        http,
        config,
        rail,
    };

    println!("🌐 Starting HTTP server...");
    app::run(state).await
}
