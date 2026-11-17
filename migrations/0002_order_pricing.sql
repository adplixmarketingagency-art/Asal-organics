-- Preserve the exact checkout breakdown; old orders intentionally remain NULL.
ALTER TABLE asal_orders ADD COLUMN pricing TEXT
  CHECK(pricing IS NULL OR json_valid(pricing));
