use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

use super::models::{ActivityEvent, PayLink, Receipt};

pub async fn expire_paylinks(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE paylinks SET status='expired' WHERE status != 'paid' AND expires_at < now()")
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn expire_paylink_by_id(pool: &PgPool, id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE paylinks SET status='expired' WHERE id = $1 AND status != 'paid' AND expires_at < now()")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn insert_paylink(pool: &PgPool, paylink: &PayLink) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO paylinks (id, merchant_pubkey, expected_amount, mint, expires_at, invoice_ref, status, created_at, paid_signature, paid_slot, privacy_rail) \
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
    )
    .bind(paylink.id)
    .bind(&paylink.merchant_pubkey)
    .bind(paylink.expected_amount)
    .bind(&paylink.mint)
    .bind(paylink.expires_at)
    .bind(&paylink.invoice_ref)
    .bind(&paylink.status)
    .bind(paylink.created_at)
    .bind(&paylink.paid_signature)
    .bind(paylink.paid_slot)
    .bind(&paylink.privacy_rail)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_paylink(pool: &PgPool, id: Uuid) -> Result<Option<PayLink>, sqlx::Error> {
    let res = sqlx::query_as::<_, PayLink>("SELECT * FROM paylinks WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(res)
}

pub async fn list_paylinks(
    pool: &PgPool,
    status: Option<String>,
    mint: Option<String>,
    q: Option<String>,
    page: i64,
    page_size: i64,
) -> Result<(Vec<PayLink>, i64), sqlx::Error> {
    let offset = (page - 1) * page_size;

    let items = sqlx::query_as::<_, PayLink>(
        "SELECT * FROM paylinks\n         WHERE ($1::text IS NULL OR status = $1)\n           AND ($2::text IS NULL OR mint = $2)\n           AND ($3::text IS NULL OR merchant_pubkey ILIKE '%' || $3 || '%' OR invoice_ref ILIKE '%' || $3 || '%')\n         ORDER BY created_at DESC\n         LIMIT $4 OFFSET $5",
    )
    .bind(&status)
    .bind(&mint)
    .bind(&q)
    .bind(page_size)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    let total: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM paylinks\n         WHERE ($1::text IS NULL OR status = $1)\n           AND ($2::text IS NULL OR mint = $2)\n           AND ($3::text IS NULL OR merchant_pubkey ILIKE '%' || $3 || '%' OR invoice_ref ILIKE '%' || $3 || '%')",
    )
    .bind(&status)
    .bind(&mint)
    .bind(&q)
    .fetch_one(pool)
    .await?;

    Ok((items, total.0))
}

pub async fn insert_activity_event(
    pool: &PgPool,
    paylink_id: Uuid,
    event_type: &str,
    detail: serde_json::Value,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO activity_events (paylink_id, type, at, detail) VALUES ($1,$2,now(),$3)",
    )
    .bind(paylink_id)
    .bind(event_type)
    .bind(detail)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn list_activity_events(
    pool: &PgPool,
    paylink_id: Uuid,
) -> Result<Vec<ActivityEvent>, sqlx::Error> {
    sqlx::query_as::<_, ActivityEvent>(
        "SELECT * FROM activity_events WHERE paylink_id = $1 ORDER BY at ASC",
    )
    .bind(paylink_id)
    .fetch_all(pool)
    .await
}

pub async fn insert_receipt(pool: &PgPool, receipt: &Receipt) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO receipts (id, paylink_id, commitment, issued_at, facts, rail) VALUES ($1,$2,$3,$4,$5,$6)",
    )
    .bind(receipt.id)
    .bind(receipt.paylink_id)
    .bind(&receipt.commitment)
    .bind(receipt.issued_at)
    .bind(&receipt.facts)
    .bind(&receipt.rail)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn list_receipts_by_paylink(
    pool: &PgPool,
    paylink_id: Uuid,
) -> Result<Vec<Receipt>, sqlx::Error> {
    sqlx::query_as::<_, Receipt>(
        "SELECT * FROM receipts WHERE paylink_id = $1 ORDER BY issued_at DESC",
    )
    .bind(paylink_id)
    .fetch_all(pool)
    .await
}

pub async fn get_receipt(pool: &PgPool, id: Uuid) -> Result<Option<Receipt>, sqlx::Error> {
    sqlx::query_as::<_, Receipt>("SELECT * FROM receipts WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn get_receipt_by_commitment(
    pool: &PgPool,
    commitment: &str,
) -> Result<Option<Receipt>, sqlx::Error> {
    sqlx::query_as::<_, Receipt>("SELECT * FROM receipts WHERE commitment = $1")
        .bind(commitment)
        .fetch_optional(pool)
        .await
}

pub async fn list_receipts_by_merchant(
    pool: &PgPool,
    merchant: Option<String>,
    page: i64,
    page_size: i64,
) -> Result<(Vec<Receipt>, i64), sqlx::Error> {
    let offset = (page - 1) * page_size;

    let items = if let Some(merchant) = merchant.clone() {
        sqlx::query_as::<_, Receipt>(
            "SELECT r.* FROM receipts r\n             JOIN paylinks p ON r.paylink_id = p.id\n             WHERE p.merchant_pubkey = $1\n             ORDER BY r.issued_at DESC\n             LIMIT $2 OFFSET $3",
        )
        .bind(merchant)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, Receipt>(
            "SELECT * FROM receipts ORDER BY issued_at DESC LIMIT $1 OFFSET $2",
        )
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?
    };

    let total: (i64,) = if let Some(merchant) = merchant {
        sqlx::query_as(
            "SELECT COUNT(*) FROM receipts r JOIN paylinks p ON r.paylink_id = p.id WHERE p.merchant_pubkey = $1",
        )
        .bind(merchant)
        .fetch_one(pool)
        .await?
    } else {
        sqlx::query_as("SELECT COUNT(*) FROM receipts")
            .fetch_one(pool)
            .await?
    };

    Ok((items, total.0))
}

pub async fn insert_webhook_event(
    pool: &PgPool,
    signature: &str,
    payload: &serde_json::Value,
) -> Result<bool, sqlx::Error> {
    let res = sqlx::query(
        "INSERT INTO webhook_events (signature, received_at, payload) VALUES ($1, now(), $2) ON CONFLICT (signature) DO NOTHING",
    )
    .bind(signature)
    .bind(payload)
    .execute(pool)
    .await?;
    Ok(res.rows_affected() > 0)
}

pub async fn mark_paylink_paid(
    tx: &mut Transaction<'_, Postgres>,
    paylink_id: Uuid,
    signature: &str,
    slot: Option<i64>,
) -> Result<Option<PayLink>, sqlx::Error> {
    let paylink = sqlx::query_as::<_, PayLink>(
        "UPDATE paylinks SET status='paid', paid_signature=$2, paid_slot=$3 WHERE id=$1 AND status != 'paid' RETURNING *",
    )
    .bind(paylink_id)
    .bind(signature)
    .bind(slot)
    .fetch_optional(&mut **tx)
    .await?;
    Ok(paylink)
}

pub async fn get_receipt_by_paylink(
    pool: &PgPool,
    paylink_id: Uuid,
) -> Result<Option<Receipt>, sqlx::Error> {
    sqlx::query_as::<_, Receipt>(
        "SELECT * FROM receipts WHERE paylink_id = $1 ORDER BY issued_at DESC LIMIT 1",
    )
    .bind(paylink_id)
    .fetch_optional(pool)
    .await
}

pub async fn find_pending_by_match(
    pool: &PgPool,
    merchant_pubkey: &str,
    mint: &str,
    amount: i64,
) -> Result<Option<PayLink>, sqlx::Error> {
    sqlx::query_as::<_, PayLink>(
        "SELECT * FROM paylinks WHERE merchant_pubkey=$1 AND mint=$2 AND expected_amount=$3 AND status='pending' AND expires_at > now() ORDER BY created_at DESC LIMIT 1",
    )
    .bind(merchant_pubkey)
    .bind(mint)
    .bind(amount)
    .fetch_optional(pool)
    .await
}
