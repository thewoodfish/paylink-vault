mod app;
mod config;
mod db;
mod error;
mod helius;
mod privacy;
mod routes;
mod util;

use dotenvy::dotenv;
use std::net::SocketAddr;
use axum::{routing::get, Router};

#[tokio::main]
async fn main() -> Result<(), error::AppError> {
    dotenv().ok();

    println!("🚀 Starting receiptless backend...");

    let config = config::Config::from_env();
    println!("📋 Config loaded");
    println!("   Database URL: {}", if config.database_url.is_empty() { "❌ NOT SET" } else { "✅ SET" });
    println!("   Port: {}", config.port);
    println!("   Cluster: {}", config.helius_cluster);

    // START SERVER FIRST - before any DB operations
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    println!("🌐 Starting HTTP server IMMEDIATELY on {}", addr);

    let app = Router::new()
        .route("/health", get(|| async {
            println!("Health check received!");
            "ok - server is running"
        }))
        .route("/", get(|| async {
            "Receiptless Backend - Server Running (check /health)"
        }));

    let listener = tokio::net::TcpListener::bind(addr).await
        .map_err(|e| {
            eprintln!("❌ Failed to bind to {}: {}", addr, e);
            error::AppError::Other(format!("Failed to bind: {}", e))
        })?;

    println!("✅ HTTP SERVER IS LISTENING on {}", addr);
    println!("   Health check endpoint: http://0.0.0.0:{}/health", addr.port());

    // Now try DB connection (after server is already running)
    println!("🔌 Now attempting database connection...");
    println!("   DB URL (first 30 chars): {}...",
        if config.database_url.len() > 30 {
            &config.database_url[..30]
        } else {
            &config.database_url
        }
    );

    match db::connect(&config.database_url).await {
        Ok(_db) => {
            println!("✅ Database connected successfully!");
            println!("   (But server already started - continuing with simple mode)");
        }
        Err(e) => {
            eprintln!("❌ Database connection failed: {}", e);
            eprintln!("   Error type: {:?}", e);
            eprintln!("   Server is still running for debugging");
        }
    }

    println!("🎯 Starting server loop...");
    axum::serve(listener, app).await
        .map_err(|e| {
            eprintln!("❌ Server error: {}", e);
            error::AppError::Other(format!("Server error: {}", e))
        })?;

    println!("Server stopped");
    Ok(())
}
