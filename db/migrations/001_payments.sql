-- Apply with a migration runner before enabling payments in production.
CREATE TABLE IF NOT EXISTS asal_orders (
  id UUID PRIMARY KEY,
  receipt VARCHAR(40) UNIQUE NOT NULL,
  razorpay_order_id TEXT UNIQUE,
  status TEXT NOT NULL,
  amount_paise INTEGER NOT NULL,
  currency CHAR(3) NOT NULL,
  customer JSONB NOT NULL,
  items JSONB NOT NULL,
  payment_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS asal_order_events (
  event_id TEXT PRIMARY KEY,
  order_id UUID,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS asal_notification_outbox (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES asal_orders(id),
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  UNIQUE (order_id, kind)
);
CREATE INDEX IF NOT EXISTS asal_orders_status_idx ON asal_orders(status, created_at);
CREATE INDEX IF NOT EXISTS asal_order_events_order_idx ON asal_order_events(order_id, created_at);
CREATE INDEX IF NOT EXISTS asal_notification_outbox_ready_idx ON asal_notification_outbox(status, next_attempt_at);
