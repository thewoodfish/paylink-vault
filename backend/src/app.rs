use std::net::SocketAddr;

use axum::{routing::get, Router};
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::trace::TraceLayer;

use crate::config::Config;
use crate::db::Db;
use crate::routes;

#[derive(Clone)]
pub struct AppState {
    pub db: Db,
    pub http: reqwest::Client,
    pub config: Config,
    pub rail: crate::privacy::rail::RailSelector,
}

pub fn build_router(state: AppState) -> Router {
    let cors = if state.config.cors_origins.is_empty() {
        CorsLayer::permissive()
    } else {
        let origins: Vec<_> = state
            .config
            .cors_origins
            .iter()
            .filter_map(|o| o.parse().ok())
            .collect();
        let allow_origin = AllowOrigin::list(origins);
        CorsLayer::new()
            .allow_origin(allow_origin)
            .allow_methods([
                axum::http::Method::GET,
                axum::http::Method::POST,
                axum::http::Method::OPTIONS,
            ])
            .allow_headers([
                axum::http::header::CONTENT_TYPE,
                axum::http::header::AUTHORIZATION,
                axum::http::HeaderName::from_static("x-webhook-secret"),
            ])
    };

    Router::new()
        .route("/health", get(|| async { "ok" }))
        .nest("/paylinks", routes::paylinks::router())
        .nest("/receipts", routes::receipts::router())
        .nest("/fees", routes::fees::router())
        .route("/helius/webhook", axum::routing::post(routes::helius_webhook::handle))
        .with_state(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
}

pub async fn run(state: AppState) -> Result<(), crate::error::AppError> {
    let addr = SocketAddr::from(([0, 0, 0, 0], state.config.port));
    let listener = tokio::net::TcpListener::bind(addr).await.map_err(|e| {
        crate::error::AppError::Other(format!("failed to bind: {}", e))
    })?;
    println!("listening on {}", addr);
    axum::serve(listener, build_router(state))
        .await
        .map_err(|e| crate::error::AppError::Other(format!("server error: {}", e)))?;
    Ok(())
}
