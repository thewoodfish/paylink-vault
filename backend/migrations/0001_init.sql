CREATE TABLE IF NOT EXISTS paylinks (
  id uuid PRIMARY KEY,
  merchant_pubkey text NOT NULL,
  expected_amount bigint NOT NULL,
  mint text NOT NULL,
  expires_at timestamptz NOT NULL,
  invoice_ref text NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL,
  paid_signature text NULL,
  paid_slot bigint NULL,
  privacy_rail text NOT NULL DEFAULT 'transparent'
);

CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY,
  paylink_id uuid NOT NULL REFERENCES paylinks(id),
  commitment text UNIQUE NOT NULL,
  issued_at timestamptz NOT NULL,
  facts jsonb NOT NULL,
  rail text NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_events (
  id bigserial PRIMARY KEY,
  paylink_id uuid NOT NULL,
  type text NOT NULL,
  at timestamptz NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id bigserial PRIMARY KEY,
  signature text UNIQUE NOT NULL,
  received_at timestamptz NOT NULL,
  payload jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_paylinks_status ON paylinks(status);
CREATE INDEX IF NOT EXISTS idx_paylinks_merchant ON paylinks(merchant_pubkey);
CREATE INDEX IF NOT EXISTS idx_receipts_paylink ON receipts(paylink_id);
CREATE INDEX IF NOT EXISTS idx_activity_paylink ON activity_events(paylink_id);
