import test from "node:test";
import assert from "node:assert/strict";

// Explicitly opt in with a disposable PostgreSQL database. Never use production.
test("PostgreSQL: durable paid orders, fulfilment concurrency and notification leases", { skip: !process.env.ADMIN_TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_URL = process.env.ADMIN_TEST_DATABASE_URL;
  const { withDatabase, createPendingOrder, attachRazorpayOrder, markPaid } = await import("../src/lib/orders.ts");
  const { getAdminOrder, listAdminOrders, updateFulfillment } = await import("../src/lib/admin-orders.ts");
  const { processNotifications, retryNotification } = await import("../src/lib/order-notifications.ts");
  const { prepareCheckoutReview } = await import("../src/lib/checkout.ts");
  const customer = { fullName: "Synthetic Test Owner Order", phone: "9876543210", email: "synthetic@example.com",
    address: "12 Test Street", apartment: "", city: "Chennai", state: "Tamil Nadu", pincode: "600001", country: "IN" };
  const review = prepareCheckoutReview({ customer, items: [{ productId: "sesame", quantity: 2 }] }).review;
  const receipt = `test_${crypto.randomUUID().slice(0, 20)}`;
  const order = await createPendingOrder(review, receipt);
  const savedFetch = globalThis.fetch;
  const envKeys = ["RESEND_API_KEY", "SELLER_ORDER_EMAIL", "SELLER_ORDER_FROM_EMAIL"];
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  try {
    assert.equal(await attachRazorpayOrder(order.id, `order_${order.id.replaceAll("-", "")}`), true);
    assert.ok(Array.isArray((await getAdminOrder(order.id)).items), "JSONB lines are stored as JSON, not a PG array");
    await assert.rejects(updateFulfillment(order.id, "unfulfilled", "packed", "owner@example.com"), { status: 409 });
    const payment = `pay_${order.id.replaceAll("-", "")}`;
    assert.deepEqual(await Promise.all([markPaid(order.id, payment), markPaid(order.id, payment)]), [true, true]);
    assert.equal(await markPaid(order.id, "pay_other"), false);
    const pending = await getAdminOrder(order.id);
    assert.equal(pending.notification.status, "pending");
    assert.equal(await withDatabase(async (c) => Number((await c.query("SELECT count(*) FROM asal_notification_outbox WHERE order_id=$1", [order.id])).rows[0].count)), 1);
    const changes = await Promise.allSettled([updateFulfillment(order.id, "unfulfilled", "packed", "owner@example.com"), updateFulfillment(order.id, "unfulfilled", "packed", "other@example.com")]);
    assert.equal(changes.filter((x) => x.status === "fulfilled").length, 1);
    assert.equal((await getAdminOrder(order.id)).history.length, 1);
    const listing = await listAdminOrders({ filter: "packed", page: 1, search: receipt });
    assert.equal(listing.total, 1);
    assert.equal(listing.orders[0].fulfillmentStatus, "packed");
    assert.equal((await listAdminOrders({ filter: "packed", page: 1, search: "' OR 1=1--" })).total, 0);
    Object.assign(process.env, { RESEND_API_KEY: "isolated-test", SELLER_ORDER_EMAIL: "owner@example.com", SELLER_ORDER_FROM_EMAIL: "orders@example.com" });
    const sent = [];
    globalThis.fetch = async (url, init) => { assert.equal(url, "https://api.resend.com/emails"); sent.push(init); return Response.json({ id: "test-email" }); };
    await Promise.all([processNotifications(), processNotifications()]);
    assert.equal(sent.length, 1, "concurrent processors only claim each row once");
    assert.equal((await getAdminOrder(order.id)).notification.status, "sent");
    await assert.rejects(retryNotification(order.id), { status: 409 });

    await withDatabase((c) => c.query("UPDATE asal_notification_outbox SET status='retry', next_attempt_at=now(), sent_at=NULL WHERE order_id=$1", [order.id]));
    process.env.SELLER_ORDER_EMAIL = "changed@example.com";
    globalThis.fetch = async (_url, init) => { sent.push(init); return Response.json({ error: "private provider detail" }, { status: 500 }); };
    await processNotifications();
    let notification = (await getAdminOrder(order.id)).notification;
    assert.equal(notification.status, "retry");
    assert.equal(sent[0].body, sent[1].body, "retry retains the same message and recipient");
    assert.equal(sent[0].headers["Idempotency-Key"], sent[1].headers["Idempotency-Key"]);
    assert.equal(notification.lastError.includes("private provider"), false);
    await retryNotification(order.id);
    assert.equal((await getAdminOrder(order.id)).notification.status, "pending");

    // Simulate a crashed worker and reclaim its expired lease.
    await withDatabase((c) => c.query("UPDATE asal_notification_outbox SET status='processing', lease_id=$2, lease_until=now()-interval '3 minutes' WHERE order_id=$1", [order.id, crypto.randomUUID()]));
    globalThis.fetch = async () => Response.json({ id: "test-email" });
    await processNotifications();
    assert.equal((await getAdminOrder(order.id)).notification.status, "sent");

    // Never resend ambiguous old notifications outside provider dedupe window.
    await withDatabase((c) => c.query("UPDATE asal_notification_outbox SET status='retry', first_attempt_at=now()-interval '23 hours', next_attempt_at=now() WHERE order_id=$1", [order.id]));
    globalThis.fetch = async () => { throw new Error("Old notification must not send"); };
    assert.equal((await processNotifications()).processed, 0);
    assert.equal((await getAdminOrder(order.id)).notification.status, "needs_review");
    await assert.rejects(retryNotification(order.id), { status: 409 });
  } finally {
    globalThis.fetch = savedFetch;
    for (const key of envKeys) if (previousEnv[key] === undefined) delete process.env[key]; else process.env[key] = previousEnv[key];
    await withDatabase(async (c) => {
      await c.query("DELETE FROM asal_fulfillment_events WHERE order_id=$1", [order.id]);
      await c.query("DELETE FROM asal_notification_outbox WHERE order_id=$1", [order.id]);
      await c.query("DELETE FROM asal_orders WHERE id=$1", [order.id]);
    });
  }
});
