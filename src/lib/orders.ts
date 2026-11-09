import "server-only";
import { Client } from "pg";
import type { CheckoutReview } from "./checkout.ts";
import { usesD1 } from "./cloudflare-db.ts";
import * as d1 from "./d1-orders.ts";

let schemaReady = false;
function databaseClient() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not configured");
  // Worker sockets belong to the invocation that opened them. Never reuse a
  // global pg pool across HTTP requests or scheduled events.
  return new Client({ connectionString: url, connectionTimeoutMillis: 5000, query_timeout: 15000 });
}

export async function withDatabase<T>(work: (client: Client) => Promise<T>) {
  const client = databaseClient();
  try {
    await client.connect();
    if (!schemaReady) {
      await ensureSchema(client);
      schemaReady = true;
    }
    return await work(client);
  } finally { await client.end(); }
}

async function ensureSchema(client: Client) {
  await client.query("BEGIN");
  try {
    // Also serialize migrations across separate Cloudflare isolates.
    await client.query("SELECT pg_advisory_xact_lock(742916305)");
    await client.query(`CREATE TABLE IF NOT EXISTS asal_orders (
    id UUID PRIMARY KEY, receipt VARCHAR(40) UNIQUE NOT NULL, razorpay_order_id TEXT UNIQUE,
    status TEXT NOT NULL, amount_paise INTEGER NOT NULL, currency CHAR(3) NOT NULL,
    customer JSONB NOT NULL, items JSONB NOT NULL, payment_id TEXT UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS asal_order_events (
    event_id TEXT PRIMARY KEY, order_id UUID, event_type TEXT NOT NULL, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS asal_notification_outbox (
    id UUID PRIMARY KEY, order_id UUID NOT NULL REFERENCES asal_orders(id), kind TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(), last_error TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), sent_at TIMESTAMPTZ,
    UNIQUE (order_id, kind)
  );
  ALTER TABLE asal_orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled';
  ALTER TABLE asal_notification_outbox ADD COLUMN IF NOT EXISTS lease_id UUID;
  ALTER TABLE asal_notification_outbox ADD COLUMN IF NOT EXISTS lease_until TIMESTAMPTZ;
  ALTER TABLE asal_notification_outbox ADD COLUMN IF NOT EXISTS first_attempt_at TIMESTAMPTZ;
  ALTER TABLE asal_notification_outbox ADD COLUMN IF NOT EXISTS delivery JSONB;
  CREATE TABLE IF NOT EXISTS asal_fulfillment_events (
    id UUID PRIMARY KEY, order_id UUID NOT NULL REFERENCES asal_orders(id),
    from_status TEXT NOT NULL, to_status TEXT NOT NULL, actor TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS asal_fulfillment_events_order_idx ON asal_fulfillment_events(order_id, created_at);
  CREATE INDEX IF NOT EXISTS asal_orders_status_idx ON asal_orders(status, created_at);
  CREATE INDEX IF NOT EXISTS asal_order_events_order_idx ON asal_order_events(order_id, created_at);
  CREATE INDEX IF NOT EXISTS asal_notification_outbox_ready_idx ON asal_notification_outbox(status, next_attempt_at);`);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
}

export type StoredOrder = { id: string; receipt: string; razorpayOrderId: string; amountPaise: number; currency: string; status: string };

export async function createPendingOrder(review: CheckoutReview, receipt: string) {
  if (usesD1()) return d1.createPendingOrder(review, receipt);
  return withDatabase(async (client) => {
    const id = crypto.randomUUID();
    const result = await client.query<StoredOrder>(
      `INSERT INTO asal_orders (id, receipt, status, amount_paise, currency, customer, items) VALUES ($1,$2,'pending',$3,$4,$5,$6) RETURNING id, receipt, razorpay_order_id AS "razorpayOrderId", amount_paise AS "amountPaise", currency, status`,
      [id, receipt, review.summary.subtotalPaise, review.currency, review.customer, JSON.stringify(review.summary.lines.map((line) => ({ productId: line.productId, variantId: line.variantId, size: line.variant.size, name: line.product.name, quantity: line.quantity, unitPricePaise: line.unitPricePaise })))],
    );
    return result.rows[0];
  });
}

export async function attachRazorpayOrder(id: string, razorpayOrderId: string) {
  if (usesD1()) return d1.attachRazorpayOrder(id, razorpayOrderId);
  return withDatabase(async (client) => (await client.query(`UPDATE asal_orders SET razorpay_order_id=$2, updated_at=now() WHERE id=$1 AND status='pending' RETURNING id`, [id, razorpayOrderId])).rowCount === 1);
}

export async function getOrder(id: string) {
  if (usesD1()) return d1.getOrder(id);
  return withDatabase(async (client) => (await client.query(`SELECT id, receipt, razorpay_order_id AS "razorpayOrderId", status, amount_paise AS "amountPaise", currency, customer, items, payment_id AS "paymentId" FROM asal_orders WHERE id=$1`, [id])).rows[0] ?? null);
}

export async function getOrderByRazorpayId(razorpayOrderId: string) {
  if (usesD1()) return d1.getOrderByRazorpayId(razorpayOrderId);
  return withDatabase(async (client) => (await client.query(`SELECT id, razorpay_order_id AS "razorpayOrderId", amount_paise AS "amountPaise", currency, status, payment_id AS "paymentId" FROM asal_orders WHERE razorpay_order_id=$1`, [razorpayOrderId])).rows[0] ?? null);
}

export async function markPaid(id: string, paymentId: string) {
  if (usesD1()) return d1.markPaid(id, paymentId);
  return withDatabase(async (client) => {
    await client.query("BEGIN");
    try {
      const result = await client.query(`UPDATE asal_orders SET status='paid', payment_id=$2, updated_at=now() WHERE id=$1 AND status='pending' RETURNING id`, [id, paymentId]);
      if (result.rowCount) await client.query(`INSERT INTO asal_notification_outbox (id, order_id, kind) VALUES ($1,$2,'seller_order_paid') ON CONFLICT DO NOTHING`, [crypto.randomUUID(), id]);
      // A duplicate confirmation succeeds only for the same captured payment.
      const alreadyPaid = !result.rowCount && (await client.query(`SELECT id FROM asal_orders WHERE id=$1 AND status='paid' AND payment_id=$2`, [id, paymentId])).rowCount === 1;
      await client.query("COMMIT");
      return result.rowCount === 1 || alreadyPaid;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function recordWebhook(eventId: string, orderId: string | null, type: string, payload: unknown) {
  if (usesD1()) return d1.recordWebhook(eventId, orderId, type, payload);
  return withDatabase(async (client) => (await client.query(`INSERT INTO asal_order_events (event_id, order_id, event_type, payload) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING event_id`, [eventId, orderId, type, payload])).rowCount === 1);
}
