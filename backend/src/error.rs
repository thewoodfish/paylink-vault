use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde::Serialize;

#[derive(Debug)]
pub enum AppError {
    BadRequest(String),
    NotFound(String),
    Unauthorized(String),
    Db(sqlx::Error),
    Http(reqwest::Error),
    Other(String),
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ErrorBody {
    error: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg),
            AppError::Db(err) => (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()),
            AppError::Http(err) => (StatusCode::BAD_GATEWAY, err.to_string()),
            AppError::Other(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };
        let body = axum::Json(ErrorBody { error: message });
        (status, body).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(value: sqlx::Error) -> Self {
        AppError::Db(value)
    }
}

impl From<reqwest::Error> for AppError {
    fn from(value: reqwest::Error) -> Self {
        AppError::Http(value)
    }
}

impl From<sqlx::migrate::MigrateError> for AppError {
    fn from(value: sqlx::migrate::MigrateError) -> Self {
        AppError::Other(value.to_string())
    }
}
