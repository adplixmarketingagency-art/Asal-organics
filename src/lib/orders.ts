import "server-only";
import { Pool, type PoolClient } from "pg";
import type { CheckoutReview } from "./checkout";

let pool: Pool | null = null;
function getPool() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not configured");
  return pool ??= new Pool({ connectionString: url, max: 3, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000 });
}

export async function withDatabase<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await getPool().connect();
  try { await ensureSchema(client); return await work(client); } finally { client.release(); }
}

async function ensureSchema(client: PoolClient) {
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
  CREATE INDEX IF NOT EXISTS asal_orders_status_idx ON asal_orders(status, created_at);
  CREATE INDEX IF NOT EXISTS asal_order_events_order_idx ON asal_order_events(order_id, created_at);
  CREATE INDEX IF NOT EXISTS asal_notification_outbox_ready_idx ON asal_notification_outbox(status, next_attempt_at);`);
}

export type StoredOrder = { id: string; receipt: string; razorpayOrderId: string; amountPaise: number; currency: string; status: string };

export async function createPendingOrder(review: CheckoutReview, receipt: string) {
  return withDatabase(async (client) => {
    const id = crypto.randomUUID();
    const result = await client.query<StoredOrder>(
      `INSERT INTO asal_orders (id, receipt, status, amount_paise, currency, customer, items) VALUES ($1,$2,'pending',$3,$4,$5,$6) RETURNING id, receipt, razorpay_order_id AS "razorpayOrderId", amount_paise AS "amountPaise", currency, status`,
      [id, receipt, review.summary.subtotalPaise, review.currency, review.customer, review.summary.lines.map((line) => ({ productId: line.productId, name: line.product.name, quantity: line.quantity, unitPricePaise: line.unitPricePaise }))],
    );
    return result.rows[0];
  });
}

export async function attachRazorpayOrder(id: string, razorpayOrderId: string) {
  return withDatabase(async (client) => (await client.query(`UPDATE asal_orders SET razorpay_order_id=$2, updated_at=now() WHERE id=$1 AND status='pending' RETURNING id`, [id, razorpayOrderId])).rowCount === 1);
}

export async function getOrder(id: string) {
  return withDatabase(async (client) => (await client.query(`SELECT id, receipt, razorpay_order_id AS "razorpayOrderId", status, amount_paise AS "amountPaise", currency, customer, items, payment_id AS "paymentId" FROM asal_orders WHERE id=$1`, [id])).rows[0] ?? null);
}

export async function getOrderByRazorpayId(razorpayOrderId: string) {
  return withDatabase(async (client) => (await client.query(`SELECT id FROM asal_orders WHERE razorpay_order_id=$1`, [razorpayOrderId])).rows[0] ?? null);
}

export async function markPaid(id: string, paymentId: string) {
  return withDatabase(async (client) => {
    await client.query("BEGIN");
    try {
      const result = await client.query(`UPDATE asal_orders SET status='paid', payment_id=$2, updated_at=now() WHERE id=$1 AND status <> 'paid' RETURNING id`, [id, paymentId]);
      if (result.rowCount) await client.query(`INSERT INTO asal_notification_outbox (id, order_id, kind) VALUES ($1,$2,'seller_order_paid') ON CONFLICT DO NOTHING`, [crypto.randomUUID(), id]);
      await client.query("COMMIT");
      return result.rowCount === 1;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function recordWebhook(eventId: string, orderId: string | null, type: string, payload: unknown) {
  return withDatabase(async (client) => (await client.query(`INSERT INTO asal_order_events (event_id, order_id, event_type, payload) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING event_id`, [eventId, orderId, type, payload])).rowCount === 1);
}
