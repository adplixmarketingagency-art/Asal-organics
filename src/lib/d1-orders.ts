import "server-only";
import { cloudflareDatabase } from "./cloudflare-db.ts";
import { AdminError } from "./admin-auth.ts";
import type { CheckoutReview } from "./checkout.ts";
import type { StoredOrder } from "./orders.ts";
import type { AdminOrder, AdminOrderDetail, OrdersResult, OrderFilter } from "./admin-types.ts";

const now = `strftime('%Y-%m-%dT%H:%M:%fZ','now')`;
const columns = `o.id, o.receipt, o.status, o.fulfillment_status AS fulfillmentStatus,
  o.amount_paise AS amountPaise, o.currency, json_extract(o.customer,'$.fullName') AS customerName,
  json_extract(o.customer,'$.city') AS city, o.created_at AS createdAt, o.updated_at AS updatedAt,
  n.status AS notificationStatus`;
const join = `FROM asal_orders o LEFT JOIN asal_notification_outbox n ON n.order_id=o.id AND n.kind='seller_order_paid'`;
const storedColumns = `id, receipt, razorpay_order_id AS razorpayOrderId, status, amount_paise AS amountPaise,
  currency, customer, items, payment_id AS paymentId`;

export async function createPendingOrder(review: CheckoutReview, receipt: string) {
  const id = crypto.randomUUID();
  const items = review.summary.lines.map((line) => ({ productId: line.productId, variantId: line.variantId,
    size: line.variant.size, name: line.product.name, quantity: line.quantity, unitPricePaise: line.unitPricePaise }));
  return (await cloudflareDatabase().prepare(`INSERT INTO asal_orders(id,receipt,status,amount_paise,currency,customer,items)
    VALUES(?,?,'pending',?,?,?,?) RETURNING id,receipt,razorpay_order_id AS razorpayOrderId,amount_paise AS amountPaise,currency,status`)
    .bind(id, receipt, review.summary.subtotalPaise, review.currency, JSON.stringify(review.customer), JSON.stringify(items))
    .first<StoredOrder>())!;
}
export async function attachRazorpayOrder(id: string, razorpayId: string) {
  const result = await cloudflareDatabase().prepare(`UPDATE asal_orders SET razorpay_order_id=?, updated_at=${now}
    WHERE id=? AND status='pending' RETURNING id`).bind(razorpayId, id).first();
  return Boolean(result);
}
type StoredDetail = StoredOrder & { customer: string; items: string; paymentId: string | null };
export async function getOrder(id: string) {
  const order = await cloudflareDatabase().prepare(`SELECT ${storedColumns} FROM asal_orders WHERE id=?`).bind(id).first<StoredDetail>();
  return order ? { ...order, customer: JSON.parse(order.customer), items: JSON.parse(order.items) } : null;
}
export async function getOrderByRazorpayId(id: string) {
  return cloudflareDatabase().prepare(`SELECT id,razorpay_order_id AS razorpayOrderId,amount_paise AS amountPaise,
    currency,status,payment_id AS paymentId FROM asal_orders WHERE razorpay_order_id=?`).bind(id).first<StoredOrder & { paymentId: string | null }>();
}
export async function markPaid(id: string, paymentId: string) {
  const db = cloudflareDatabase();
  // The schema's AFTER UPDATE trigger creates the outbox row in this same write.
  const result = await db.prepare(`UPDATE asal_orders SET status='paid',payment_id=?,updated_at=${now}
    WHERE id=? AND status='pending' RETURNING id`).bind(paymentId, id).first();
  return Boolean(result || await db.prepare("SELECT id FROM asal_orders WHERE id=? AND status='paid' AND payment_id=?").bind(id, paymentId).first());
}
export async function recordWebhook(id: string, orderId: string | null, type: string, payload: unknown) {
  return Boolean(await cloudflareDatabase().prepare(`INSERT INTO asal_order_events(event_id,order_id,event_type,payload)
    VALUES(?,?,?,?) ON CONFLICT DO NOTHING RETURNING event_id`).bind(id, orderId, type, JSON.stringify(payload)).first());
}
export async function listAdminOrders({ filter, page, search }: { filter: OrderFilter; page: number; search: string }): Promise<OrdersResult> {
  const db = cloudflareDatabase();
  const where = `WHERE (?1='all' OR (?1 IN ('paid','pending') AND o.status=?1) OR (o.status='paid' AND o.fulfillment_status=?1))
    AND (?2='' OR instr(lower(o.receipt),lower(?2))>0 OR instr(lower(json_extract(o.customer,'$.fullName')),lower(?2))>0)`;
  const orders = await db.prepare(`SELECT ${columns} ${join} ${where} ORDER BY o.created_at DESC,o.id DESC LIMIT 20 OFFSET ?3`)
    .bind(filter, search, (page - 1) * 20).all<AdminOrder>();
  const total = (await db.prepare(`SELECT count(*) AS count ${join} ${where}`).bind(filter, search).first<{ count: number }>())!.count;
  const summary = (await db.prepare(`SELECT
    count(*) FILTER (WHERE o.status='paid') AS paid,
    count(*) FILTER (WHERE o.status='paid' AND o.fulfillment_status='unfulfilled') AS unfulfilled,
    count(*) FILTER (WHERE o.status='paid' AND o.fulfillment_status='shipped') AS shipped,
    count(*) FILTER (WHERE n.status IN ('failed','needs_review')) AS notificationIssues ${join}`).first<OrdersResult["summary"]>())!;
  return { orders: orders.results, total, summary, page, pageSize: 20 };
}
export async function getAdminOrder(id: string): Promise<AdminOrderDetail | null> {
  const db = cloudflareDatabase();
  const row = await db.prepare(`SELECT ${columns},o.customer,o.items,
    o.payment_id AS paymentId,o.razorpay_order_id AS razorpayOrderId,
    CASE WHEN n.id IS NULL THEN NULL ELSE json_object('id',n.id,'status',n.status,'attempts',n.attempts,
      'lastError',n.last_error,'nextAttemptAt',n.next_attempt_at,'sentAt',n.sent_at,'firstAttemptAt',n.first_attempt_at) END AS notification
    ${join} WHERE o.id=?`).bind(id).first<Omit<AdminOrderDetail, "customer" | "items" | "notification" | "history"> & { customer: string; items: string; notification: string | null }>();
  if (!row) return null;
  const history = await db.prepare(`SELECT id,from_status AS fromStatus,to_status AS toStatus,actor,created_at AS createdAt
    FROM asal_fulfillment_events WHERE order_id=? ORDER BY created_at DESC LIMIT 30`).bind(id).all<AdminOrderDetail["history"][number]>();
  return { ...row, customer: JSON.parse(row.customer), items: JSON.parse(row.items),
    notification: row.notification ? JSON.parse(row.notification) : null, history: history.results };
}
export async function updateFulfillment(id: string, from: string, to: string, actor: string) {
  // The audit trigger runs atomically only for the winning compare-and-swap.
  const result = await cloudflareDatabase().prepare(`UPDATE asal_orders SET fulfillment_status=?,fulfillment_actor=?,updated_at=${now}
    WHERE id=? AND status='paid' AND fulfillment_status=? RETURNING id`).bind(to, actor, id, from).first();
  if (!result) throw new AdminError("Order changed or payment is not confirmed. Refresh before updating.", 409);
}
