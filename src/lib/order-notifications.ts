import "server-only";
import { timingSafeEqual } from "node:crypto";
import { withDatabase } from "./orders.ts";
import { AdminError } from "./admin-auth.ts";
import { usesD1 } from "./cloudflare-db.ts";
import * as d1 from "./d1-notifications.ts";

export type Delivery = { from: string; to: string[]; subject: string; text: string };
export type Job = { id: string; leaseId: string; attempts: number; delivery: Delivery };
const MAX_ATTEMPTS = 6;
// Stop ambiguous delivery retries before Resend's 24-hour deduplication expires.
const RETRY_WINDOW_HOURS = 22;

export function notificationConfig(env = process.env) {
  const key = env.RESEND_API_KEY?.trim() ?? "";
  const to = env.SELLER_ORDER_EMAIL?.trim() ?? "";
  const from = env.SELLER_ORDER_FROM_EMAIL?.trim() ?? "";
  const email = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  return key && email.test(to) && email.test(from) ? { key, to, from } : null;
}

export function notificationReadiness() {
  return { emailConfigured: Boolean(notificationConfig()), processorConfigured: Boolean(process.env.NOTIFICATION_CRON_SECRET?.length && process.env.NOTIFICATION_CRON_SECRET.length >= 32) };
}

export function requireNotificationCron(request: Request, secret = process.env.NOTIFICATION_CRON_SECRET ?? "") {
  const token = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (secret.length < 32 || Buffer.byteLength(token) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
    throw new AdminError("Unauthorized.", 401);
  }
}

export function deliveryForOrder(order: { id: string; receipt: string; amountPaise: number }, config: NonNullable<ReturnType<typeof notificationConfig>>): Delivery {
  // Deliberately exclude customer PII from email. The authenticated dashboard holds it.
  return { from: config.from, to: [config.to], subject: `Asal · Paid order ${order.receipt}`,
    text: `A verified payment of INR ${(order.amountPaise / 100).toFixed(2)} has been received.\n\nOrder: ${order.receipt}\nView items, delivery details and fulfilment:\nhttps://asaliyarkaiangadi.in/admin/orders?order=${order.id}\n\nThis is an owner notification, not a customer receipt.` };
}

export function retryDelay(attempts: number) {
  return Math.min(3600, 60 * 2 ** Math.max(0, attempts - 1));
}

async function claimNotification(config: NonNullable<ReturnType<typeof notificationConfig>>): Promise<Job | null> {
  if (usesD1()) return d1.claimNotification((order) => deliveryForOrder(order, config));
  return withDatabase(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query(`UPDATE asal_notification_outbox SET status='failed', lease_id=NULL, lease_until=NULL,
        last_error='Worker stopped before confirming delivery. Check provider status or queue a safe retry.'
        WHERE kind='seller_order_paid' AND status='processing' AND lease_until<now() AND attempts >= ${MAX_ATTEMPTS}`);
      await client.query(`UPDATE asal_notification_outbox SET status='needs_review', lease_id=NULL, lease_until=NULL,
        last_error='Delivery window expired. Check the email provider before any manual resend.'
        WHERE kind='seller_order_paid' AND status IN ('pending','retry','processing','failed')
        AND first_attempt_at < now() - interval '${RETRY_WINDOW_HOURS} hours'
        AND (lease_until IS NULL OR lease_until < now())`);
      const row = (await client.query(`SELECT n.id, n.attempts, n.delivery, o.id AS "orderId", o.receipt, o.amount_paise AS "amountPaise"
        FROM asal_notification_outbox n JOIN asal_orders o ON o.id=n.order_id
        WHERE n.kind='seller_order_paid' AND o.status='paid'
          AND ((n.status IN ('pending','retry') AND n.next_attempt_at<=now())
            OR (n.status='processing' AND n.lease_until<now()))
          AND (n.first_attempt_at IS NULL OR n.first_attempt_at >= now() - interval '${RETRY_WINDOW_HOURS} hours')
        ORDER BY n.created_at LIMIT 1 FOR UPDATE OF n SKIP LOCKED`)).rows[0];
      if (!row) { await client.query("COMMIT"); return null; }
      const leaseId = crypto.randomUUID();
      const delivery = row.delivery ?? deliveryForOrder({ id: row.orderId, receipt: row.receipt, amountPaise: row.amountPaise }, config);
      const attempts = row.attempts + 1;
      await client.query(`UPDATE asal_notification_outbox SET status='processing', attempts=$2,
        lease_id=$3, lease_until=now()+interval '2 minutes', first_attempt_at=coalesce(first_attempt_at, now()),
        delivery=$4 WHERE id=$1`, [row.id, attempts, leaseId, delivery]);
      await client.query("COMMIT");
      return { id: row.id, leaseId, attempts, delivery };
    } catch (error) { await client.query("ROLLBACK"); throw error; }
  });
}

async function completeNotification(job: Job, error: string | null) {
  if (usesD1()) return d1.completeNotification(job, error, retryDelay(job.attempts));
  return withDatabase(async (client) => {
    const status = !error ? "sent" : job.attempts >= MAX_ATTEMPTS ? "failed" : "retry";
    await client.query(`UPDATE asal_notification_outbox SET status=$3, last_error=$4,
      sent_at=CASE WHEN $3='sent' THEN now() ELSE sent_at END,
      next_attempt_at=now()+($5 * interval '1 second'), lease_id=NULL, lease_until=NULL
      WHERE id=$1 AND lease_id=$2 AND status='processing'`,
    [job.id, job.leaseId, status, error, retryDelay(job.attempts)]);
  });
}

export async function sendNotification(job: Job, key: string, fetcher: typeof fetch = fetch) {
  try {
    // JSONB reorders object keys on read. Canonicalise every send so retries use
    // byte-identical request bodies as well as the same provider idempotency key.
    const { from, to, subject, text } = job.delivery;
    const result = await fetcher("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `asal-paid-${job.id}` },
      body: JSON.stringify({ from, to, subject, text }), signal: AbortSignal.timeout(10000),
    });
    // Provider payloads can include addresses/credentials: never persist them as errors.
    if (!result.ok) return `Email provider returned HTTP ${result.status}. Check provider configuration or retry.`;
    const body = await result.json() as { id?: unknown };
    return typeof body.id === "string" && body.id ? null : "Email provider returned an unconfirmed response.";
  } catch { return "Email delivery could not be confirmed. A safe retry is queued."; }
}

const dependencies = { config: notificationConfig, claim: claimNotification, send: sendNotification, complete: completeNotification };
export async function processNotifications(deps = dependencies) {
  const config = deps.config();
  if (!config) throw new AdminError("Email delivery is not configured. No notifications were sent.", 503);
  let processed = 0;
  let accepted = 0;
  for (let i = 0; i < 5; i++) {
    const job = await deps.claim(config);
    if (!job) break;
    const error = await deps.send(job, config.key);
    // If DB acknowledgement fails, leave the lease for a safe idempotent retry.
    await deps.complete(job, error);
    processed++;
    if (!error) accepted++;
  }
  return { processed, accepted };
}

export async function retryNotification(orderId: string) {
  if (!notificationConfig()) throw new AdminError("Configure owner email delivery before retrying.", 503);
  if (usesD1()) return d1.retryNotification(orderId);
  return withDatabase(async (client) => {
    const result = await client.query(`UPDATE asal_notification_outbox SET status='pending', next_attempt_at=now(), last_error=NULL
      WHERE order_id=$1 AND kind='seller_order_paid' AND status IN ('failed','retry')
        AND first_attempt_at >= now()-interval '${RETRY_WINDOW_HOURS} hours' RETURNING id`, [orderId]);
    if (!result.rowCount) throw new AdminError("This notification cannot be retried. Refresh; older attempts need provider review to avoid duplicates.", 409);
  });
}
