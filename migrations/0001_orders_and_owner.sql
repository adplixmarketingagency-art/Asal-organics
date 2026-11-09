CREATE TABLE IF NOT EXISTS asal_orders (
  id TEXT PRIMARY KEY, receipt TEXT UNIQUE NOT NULL, razorpay_order_id TEXT UNIQUE,
  status TEXT NOT NULL CHECK(status IN ('pending','paid')), amount_paise INTEGER NOT NULL,
  currency TEXT NOT NULL, customer TEXT NOT NULL CHECK(json_valid(customer)),
  items TEXT NOT NULL CHECK(json_valid(items)), payment_id TEXT UNIQUE,
  fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled'
    CHECK(fulfillment_status IN ('unfulfilled','packed','shipped','delivered')),
  fulfillment_actor TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS asal_order_events (
  event_id TEXT PRIMARY KEY, order_id TEXT, event_type TEXT NOT NULL, payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS asal_notification_outbox (
  id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES asal_orders(id), kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_error TEXT, sent_at TEXT, lease_id TEXT, lease_until TEXT, first_attempt_at TEXT,
  delivery TEXT, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(order_id, kind)
);
CREATE TABLE IF NOT EXISTS asal_fulfillment_events (
  id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES asal_orders(id),
  from_status TEXT NOT NULL, to_status TEXT NOT NULL, actor TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
-- Triggers make the payment+outbox and fulfilment+audit writes atomic in D1.
CREATE TRIGGER IF NOT EXISTS asal_paid_outbox AFTER UPDATE OF status ON asal_orders
WHEN NEW.status='paid' AND OLD.status='pending'
BEGIN
  INSERT INTO asal_notification_outbox(id,order_id,kind)
    VALUES(NEW.id,NEW.id,'seller_order_paid') ON CONFLICT DO NOTHING;
END;
CREATE TRIGGER IF NOT EXISTS asal_fulfillment_audit AFTER UPDATE OF fulfillment_status ON asal_orders
WHEN OLD.fulfillment_status<>NEW.fulfillment_status
BEGIN
  INSERT INTO asal_fulfillment_events(id,order_id,from_status,to_status,actor)
    VALUES(lower(hex(randomblob(16))),NEW.id,OLD.fulfillment_status,NEW.fulfillment_status,NEW.fulfillment_actor);
END;
CREATE INDEX IF NOT EXISTS asal_orders_status_idx ON asal_orders(status, created_at);
CREATE INDEX IF NOT EXISTS asal_order_events_order_idx ON asal_order_events(order_id, created_at);
CREATE INDEX IF NOT EXISTS asal_fulfillment_events_order_idx ON asal_fulfillment_events(order_id, created_at);
CREATE INDEX IF NOT EXISTS asal_notification_ready_idx ON asal_notification_outbox(status, next_attempt_at);
CREATE TABLE IF NOT EXISTS asal_owner_sessions (
  token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, credential_version TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS asal_owner_session_expiry ON asal_owner_sessions(expires_at);
CREATE TABLE IF NOT EXISTS asal_login_limits (
  key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS asal_login_limit_expiry ON asal_login_limits(expires_at);
