# Receiptless PayLinks Backend

Rust (Axum + Postgres) backend for Receiptless PayLinks with Helius webhooks, enhanced transactions, priority fee estimates, and a pluggable privacy rail abstraction.

## Setup

1) Start Postgres
```bash
cd backend
docker-compose up -d
```

2) Configure env
```bash
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/receiptless
export PORT=8080
export RUST_LOG=info
export HELIUS_API_KEY=your_key
export HELIUS_CLUSTER=devnet
export WEBHOOK_SECRET=optional_secret
export CORS_ORIGINS=http://localhost:3000
export BASE_PAY_URL=http://localhost:3000
export PRIVACY_RAIL=transparent
```

3) Run migrations
```bash
cd backend
cargo install sqlx-cli --no-default-features --features rustls,postgres
sqlx migrate run
```

4) Start server
```bash
cd backend
cargo run
```

## Curl examples

Create a paylink:
```bash
curl -X POST http://localhost:8080/paylinks \
  -H 'Content-Type: application/json' \
  -d '{
    "merchantPubkey":"MerchantPubkeyHere",
    "expectedAmount":1000000,
    "mint":"So11111111111111111111111111111111111111112",
    "expiresAt":"2030-01-01T00:00:00Z",
    "invoiceRef":"INV-001",
    "memoPolicy":{"enabled":true,"template":"paylink:{id}"},
    "receiptFieldsPolicy":{
      "merchant":true,"amount":true,"token":true,"timeWindow":true,
      "invoiceRef":false,"paylinkId":false
    }
  }'
```

List paylinks:
```bash
curl "http://localhost:8080/paylinks?page=1"
```

Simulate webhook:
```bash
curl -X POST http://localhost:8080/helius/webhook \
  -H 'Content-Type: application/json' \
  -H 'x-webhook-secret: optional_secret' \
  -d '{"signature":"<sig>","memo":"paylink:<uuid>"}'
```

Verify receipt:
```bash
curl -X POST http://localhost:8080/receipts/verify \
  -H 'Content-Type: application/json' \
  -d '{
    "proof":{
      "commitment":"<hex>",
      "nonce":"<hex>",
      "revealed":{
        "paylinkId":"<uuid>",
        "merchantPubkey":"MerchantPubkeyHere",
        "amount":1000000,
        "mint":"So11111111111111111111111111111111111111112",
        "slot":12345,
        "invoiceRef":"INV-001"
      }
    }
  }'
```

Priority fee estimate:
```bash
curl -X POST http://localhost:8080/fees/priority-estimate \
  -H 'Content-Type: application/json' \
  -d '{
    "accounts":{"accountKeys":["Account1","Account2"]},
    "level":"medium"
  }'
```
