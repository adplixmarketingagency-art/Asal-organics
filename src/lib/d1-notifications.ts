import "server-only";
import { cloudflareDatabase } from "./cloudflare-db.ts";
import { AdminError } from "./admin-auth.ts";
import type { Delivery, Job } from "./order-notifications.ts";

const now = `strftime('%Y-%m-%dT%H:%M:%fZ','now')`;
const cutoff = `strftime('%Y-%m-%dT%H:%M:%fZ','now','-22 hours')`;
export async function claimNotification(makeDelivery: (order: { id: string; receipt: string; amountPaise: number }) => Delivery): Promise<Job | null> {
  const db = cloudflareDatabase();
  const leaseId = crypto.randomUUID();
  const results = await db.batch([
    db.prepare(`UPDATE asal_notification_outbox SET status='failed',lease_id=NULL,lease_until=NULL,
      last_error='Worker stopped before confirming delivery. Check provider status or queue a safe retry.'
      WHERE kind='seller_order_paid' AND status='processing' AND lease_until<${now} AND attempts>=6`),
    db.prepare(`UPDATE asal_notification_outbox SET status='needs_review',lease_id=NULL,lease_until=NULL,
      last_error='Delivery window expired. Check the email provider before any manual resend.'
      WHERE kind='seller_order_paid' AND status IN ('pending','retry','processing','failed')
      AND first_attempt_at<${cutoff} AND (lease_until IS NULL OR lease_until<${now})`),
    // One atomic UPDATE selects and leases a job; no race between read and claim.
    db.prepare(`UPDATE asal_notification_outbox SET status='processing',attempts=attempts+1,
      lease_id=?,lease_until=strftime('%Y-%m-%dT%H:%M:%fZ','now','+2 minutes'),
      first_attempt_at=coalesce(first_attempt_at,${now})
      WHERE id=(SELECT n.id FROM asal_notification_outbox n JOIN asal_orders o ON o.id=n.order_id
        WHERE n.kind='seller_order_paid' AND o.status='paid'
        AND ((n.status IN ('pending','retry') AND n.next_attempt_at<=${now}) OR (n.status='processing' AND n.lease_until<${now}))
        AND (n.first_attempt_at IS NULL OR n.first_attempt_at>=${cutoff})
        ORDER BY n.created_at LIMIT 1)
      RETURNING id,order_id AS orderId,attempts,delivery`).bind(leaseId),
  ]);
  const row = results[2].results[0];
  if (!row) return null;
  let delivery: Delivery;
  if (typeof row.delivery === "string") delivery = JSON.parse(row.delivery);
  else {
    const order = (await db.prepare("SELECT id,receipt,amount_paise AS amountPaise FROM asal_orders WHERE id=?")
      .bind(row.orderId).first<{ id: string; receipt: string; amountPaise: number }>())!;
    delivery = makeDelivery(order);
    const persisted = await db.prepare("UPDATE asal_notification_outbox SET delivery=? WHERE id=? AND lease_id=? AND status='processing' RETURNING id")
      .bind(JSON.stringify(delivery), row.id, leaseId).first();
    if (!persisted) return null;
  }
  return { id: String(row.id), leaseId, attempts: Number(row.attempts), delivery };
}
export async function completeNotification(job: Job, error: string | null, delay: number) {
  const status = !error ? "sent" : job.attempts >= 6 ? "failed" : "retry";
  await cloudflareDatabase().prepare(`UPDATE asal_notification_outbox SET status=?1,last_error=?2,
    sent_at=CASE WHEN ?1='sent' THEN ${now} ELSE sent_at END,
    next_attempt_at=strftime('%Y-%m-%dT%H:%M:%fZ','now',?3),lease_id=NULL,lease_until=NULL
    WHERE id=?4 AND lease_id=?5 AND status='processing'`).bind(status, error, `+${delay} seconds`, job.id, job.leaseId).run();
}
export async function retryNotification(orderId: string) {
  const result = await cloudflareDatabase().prepare(`UPDATE asal_notification_outbox SET status='pending',next_attempt_at=${now},last_error=NULL
    WHERE order_id=? AND kind='seller_order_paid' AND status IN ('failed','retry') AND first_attempt_at>=${cutoff} RETURNING id`).bind(orderId).first();
  if (!result) throw new AdminError("This notification cannot be retried. Refresh; older attempts need provider review to avoid duplicates.", 409);
}
