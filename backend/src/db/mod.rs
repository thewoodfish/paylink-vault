use sqlx::{postgres::PgPoolOptions, PgPool};

pub type Db = PgPool;

pub async fn connect(url: &str) -> Result<Db, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(10)
        .connect(url)
        .await
}

pub mod models;
pub mod queries;
