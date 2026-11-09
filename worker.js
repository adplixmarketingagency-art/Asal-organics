// Custom OpenNext entry point: the scheduled event uses the same request context
// and runtime secrets as HTTP requests, without making a public network request.
import worker from "./.open-next/worker.js";
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

export default {
  fetch: worker.fetch,
  async scheduled(_controller, env, ctx) {
    // No setup = no delivery attempts and no payment side effects.
    if (!env.NOTIFICATION_CRON_SECRET || !env.RESEND_API_KEY ||
      !env.SELLER_ORDER_EMAIL || !env.SELLER_ORDER_FROM_EMAIL) return;
    const response = await worker.fetch(new Request("https://asaliyarkaiangadi.in/api/internal/notifications", {
      method: "POST", headers: { Authorization: `Bearer ${env.NOTIFICATION_CRON_SECRET}` },
    }), env, ctx);
    if (!response.ok) throw new Error(`Notification processor failed (${response.status})`);
  },
};
