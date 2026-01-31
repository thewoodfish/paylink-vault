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

    // Start server WITHOUT database first (for debugging/tracing)
    println!("⚠️  RUNNING IN DEBUG MODE - Server will start without DB");
    println!("🌐 Starting HTTP server on port {}...", config.port);

    // Try to connect to DB in background, but don't fail if it doesn't work
    println!("🔌 Attempting database connection...");
    match db::connect(&config.database_url).await {
        Ok(database) => {
            println!("✅ Database connected");

            println!("🔄 Running migrations...");
            match sqlx::migrate!("./migrations").run(&database).await {
                Ok(_) => println!("✅ Migrations complete"),
                Err(e) => {
                    eprintln!("⚠️  Migration failed (continuing anyway): {}", e);
                    eprintln!("   App will start but database operations will fail");
                }
            }

            let http = reqwest::Client::new();
            let rail = privacy::rail::RailSelector::new(&config.privacy_rail);

            let state = AppState {
                db: database,
                http,
                config,
                rail,
            };

            println!("✅ Server starting with database connection");
            app::run(state).await
        }
        Err(e) => {
            eprintln!("⚠️  Database connection failed: {}", e);
            eprintln!("   Starting server anyway for debugging...");
            eprintln!("   All routes will return 503 errors");

            // Start a minimal server just for health checks
            use std::net::SocketAddr;
            use axum::{routing::get, Router};

            let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
            println!("🌐 Starting minimal server on {}", addr);

            let app = Router::new()
                .route("/health", get(|| async { "ok - but no database" }))
                .route("/", get(|| async { "Server running but database connection failed. Check logs." }));

            let listener = tokio::net::TcpListener::bind(addr).await
                .map_err(|e| error::AppError::Other(format!("Failed to bind: {}", e)))?;

            println!("✅ Minimal server listening on {}", addr);
            println!("   Visit http://localhost:{} to verify", config.port);

            axum::serve(listener, app).await
                .map_err(|e| error::AppError::Other(format!("Server error: {}", e)))?;

            Ok(())
        }
    }
}
