import "server-only";
import { withDatabase } from "./orders.ts";
import { usesD1 } from "./cloudflare-db.ts";
import * as d1 from "./d1-orders.ts";
import { AdminError } from "./admin-auth.ts";
import { fulfillmentStatuses, type AdminOrder, type AdminOrderDetail, type OrderFilter, type OrdersResult, type FulfillmentStatus } from "./admin-types.ts";

export function orderQuery(url: URL) {
  const filter = url.searchParams.get("status") ?? "all";
  if (!["all", "pending", "paid", ...fulfillmentStatuses].includes(filter)) throw new AdminError("Invalid order filter.", 400);
  const page = url.searchParams.get("page") ?? "1";
  if (!/^[1-9]\d{0,4}$/.test(page)) throw new AdminError("Invalid page.", 400);
  const search = (url.searchParams.get("q") ?? "").trim();
  if (search.length > 100) throw new AdminError("Search is too long.", 400);
  return { filter: filter as OrderFilter, page: Number(page), search };
}

export function validOrderId(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new AdminError("Order not found.", 404);
  }
}

const columns = `o.id, o.receipt, o.status, o.fulfillment_status AS "fulfillmentStatus",
  o.amount_paise AS "amountPaise", o.currency, o.customer->>'fullName' AS "customerName",
  o.customer->>'city' AS city, o.created_at AS "createdAt", o.updated_at AS "updatedAt",
  n.status AS "notificationStatus"`;
const join = `FROM asal_orders o LEFT JOIN asal_notification_outbox n ON n.order_id=o.id AND n.kind='seller_order_paid'`;

export async function listAdminOrders(query: ReturnType<typeof orderQuery>): Promise<OrdersResult> {
  if (usesD1()) return d1.listAdminOrders(query);
  return withDatabase(async (client) => {
    const { filter, page, search } = query;
    const where = `WHERE ($1='all' OR ($1 IN ('paid','pending') AND o.status=$1)
      OR (o.status='paid' AND o.fulfillment_status=$1))
      AND ($2='' OR strpos(lower(o.receipt), lower($2))>0 OR strpos(lower(o.customer->>'fullName'), lower($2))>0)`;
    const params = [filter, search];
    const orders = (await client.query<AdminOrder>(`SELECT ${columns} ${join} ${where}
      ORDER BY o.created_at DESC, o.id DESC LIMIT 20 OFFSET $3`, [...params, (page - 1) * 20])).rows;
    const total = Number((await client.query(`SELECT count(*) ${join} ${where}`, params)).rows[0].count);
    const summary = (await client.query<OrdersResult["summary"]>(`SELECT
      count(*) FILTER (WHERE o.status='paid')::int AS paid,
      count(*) FILTER (WHERE o.status='paid' AND o.fulfillment_status='unfulfilled')::int AS unfulfilled,
      count(*) FILTER (WHERE o.status='paid' AND o.fulfillment_status='shipped')::int AS shipped,
      count(*) FILTER (WHERE n.status IN ('failed','needs_review'))::int AS "notificationIssues" ${join}`)).rows[0];
    return { orders, total, page, pageSize: 20, summary };
  });
}

export async function getAdminOrder(id: string): Promise<AdminOrderDetail | null> {
  validOrderId(id);
  if (usesD1()) return d1.getAdminOrder(id);
  return withDatabase(async (client) => {
    const order = (await client.query<AdminOrderDetail>(`SELECT ${columns}, o.customer, o.items,
      o.payment_id AS "paymentId", o.razorpay_order_id AS "razorpayOrderId",
      CASE WHEN n.id IS NULL THEN NULL ELSE json_build_object('id', n.id, 'status', n.status,
        'attempts', n.attempts, 'lastError', n.last_error, 'nextAttemptAt', n.next_attempt_at,
        'sentAt', n.sent_at, 'firstAttemptAt', n.first_attempt_at) END AS notification
      ${join} WHERE o.id=$1`, [id])).rows[0];
    if (!order) return null;
    order.history = (await client.query(`SELECT id, from_status AS "fromStatus", to_status AS "toStatus",
      actor, created_at AS "createdAt" FROM asal_fulfillment_events WHERE order_id=$1 ORDER BY created_at DESC LIMIT 30`, [id])).rows;
    return order;
  });
}

export function validateTransition(from: unknown, to: unknown): asserts to is FulfillmentStatus {
  const index = fulfillmentStatuses.indexOf(from as FulfillmentStatus);
  if (index < 0 || index >= fulfillmentStatuses.length - 1 || fulfillmentStatuses[index + 1] !== to) {
    throw new AdminError("Orders must move from unfulfilled to packed, shipped, then delivered.", 400);
  }
}

export async function updateFulfillment(id: string, from: unknown, to: unknown, actor: string) {
  validOrderId(id);
  validateTransition(from, to);
  if (usesD1()) return d1.updateFulfillment(id, from as string, to, actor);
  return withDatabase(async (client) => {
    await client.query("BEGIN");
    try {
      const result = await client.query(`UPDATE asal_orders SET fulfillment_status=$3, updated_at=now()
        WHERE id=$1 AND status='paid' AND fulfillment_status=$2 RETURNING id`, [id, from, to]);
      if (!result.rowCount) throw new AdminError("Order changed or payment is not confirmed. Refresh before updating.", 409);
      await client.query(`INSERT INTO asal_fulfillment_events (id, order_id, from_status, to_status, actor)
        VALUES ($1,$2,$3,$4,$5)`, [crypto.randomUUID(), id, from, to, actor]);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; }
  });
}
