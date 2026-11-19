ALTER TABLE asal_orders ADD COLUMN order_kind TEXT NOT NULL DEFAULT 'standard'
  CHECK(order_kind IN ('standard','custom'));
ALTER TABLE asal_orders ADD COLUMN custom_recipe TEXT
  CHECK(custom_recipe IS NULL OR json_valid(custom_recipe));
CREATE TABLE IF NOT EXISTS asal_custom_request_limits (
  key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
