import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { createHash } from "node:crypto";
import { createPendingOrder, attachRazorpayOrder, markPaid, getOrder, recordWebhook } from "../src/lib/orders.ts";
import { getAdminOrder, listAdminOrders, updateFulfillment } from "../src/lib/admin-orders.ts";
import { processNotifications, retryNotification } from "../src/lib/order-notifications.ts";
import { prepareCheckoutReview } from "../src/lib/checkout.ts";
import { allowLogin, createOwnerSession, revokeOwnerSession, sessionOwner, ownerCookie } from "../src/lib/owner-session.ts";

test("D1: real SQLite order transactions, notification leases, sessions and distributed rate limits", async () => {
  const mf = new Miniflare(convertV4MiniflareOptions({ name: "test", modules: true, script: "export default {fetch(){return new Response('test')}}",
    compatibilityDate: "2026-11-02", d1Databases: ["ASAL_DB"] }));
  const db = await mf.getD1Database("ASAL_DB");
  const oldFetch = globalThis.fetch;
  const oldStorage = process.env.ORDER_STORAGE;
  const oldContext = globalThis[Symbol.for("__cloudflare-context__")];
  const envKeys = ["RESEND_API_KEY", "SELLER_ORDER_EMAIL", "SELLER_ORDER_FROM_EMAIL"];
  const oldEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  try {
    await db.exec(readFileSync(new URL("../migrations/0001_orders_and_owner.sql", import.meta.url), "utf8")
      .replace(/--[^\n]*/g, "").replace(/\n/g, " "));
    globalThis[Symbol.for("__cloudflare-context__")] = { env: { ASAL_DB: db } };
    process.env.ORDER_STORAGE = "d1";
    const customer = { fullName: "Synthetic D1 Test", phone: "9876543210", email: "synthetic@example.com", address: "12 Test Street", apartment: "",
      city: "Chennai", state: "Tamil Nadu", pincode: "600001", country: "IN" };
    const review = prepareCheckoutReview({ customer, items: [{ productId: "sesame", quantity: 2 }] }).review;
    const order = await createPendingOrder(review, "synthetic-d1-order");
    assert.equal(await attachRazorpayOrder(order.id, "order_synthetic"), true);
    assert.ok(Array.isArray((await getOrder(order.id)).items));
    await assert.rejects(updateFulfillment(order.id, "unfulfilled", "packed", "owner@example.com"), { status: 409 });
    assert.deepEqual(await Promise.all([markPaid(order.id, "pay_synthetic"), markPaid(order.id, "pay_synthetic")]), [true, true]);
    assert.equal(await markPaid(order.id, "pay_wrong"), false);
    assert.equal((await db.prepare("SELECT count(*) AS n FROM asal_notification_outbox").first()).n, 1);
    const changes = await Promise.allSettled([updateFulfillment(order.id, "unfulfilled", "packed", "owner@example.com"),
      updateFulfillment(order.id, "unfulfilled", "packed", "other@example.com")]);
    assert.equal(changes.filter(x => x.status === "fulfilled").length, 1);
    assert.equal((await getAdminOrder(order.id)).history.length, 1);
    assert.equal((await listAdminOrders({ filter: "packed", page: 1, search: "synthetic" })).total, 1);
    assert.equal((await listAdminOrders({ filter: "all", page: 1, search: "' OR 1=1" })).total, 0);
    assert.equal(await recordWebhook("event_synthetic", order.id, "payment.captured", {}), true);
    assert.equal(await recordWebhook("event_synthetic", order.id, "payment.captured", {}), false);
    Object.assign(process.env, { RESEND_API_KEY: "test-only", SELLER_ORDER_EMAIL: "owner@example.com", SELLER_ORDER_FROM_EMAIL: "orders@example.com" });
    const sent = [];
    globalThis.fetch = async (_url, init) => { sent.push(init); return Response.json({ id: "no-real-email" }); };
    await Promise.all([processNotifications(), processNotifications()]);
    assert.equal(sent.length, 1);
    assert.equal((await getAdminOrder(order.id)).notification.status, "sent");
    await db.prepare("UPDATE asal_notification_outbox SET status='retry'").run();
    process.env.SELLER_ORDER_EMAIL = "changed@example.com";
    globalThis.fetch = async (_url, init) => { sent.push(init); return Response.json({}, { status: 500 }); };
    await db.prepare("UPDATE asal_notification_outbox SET next_attempt_at='2020-01-01T00:00:00Z'").run();
    await processNotifications();
    assert.equal(sent[0].body, sent[1].body);
    await retryNotification(order.id);
    await db.prepare("UPDATE asal_notification_outbox SET first_attempt_at='2020-01-01T00:00:00Z'").run();
    assert.equal((await processNotifications()).processed, 0);
    assert.equal((await getAdminOrder(order.id)).notification.status, "needs_review");
    await assert.rejects(retryNotification(order.id), { status: 409 });

    const config = { email: "owner@example.com", version: "test-version", passwordHash: "test-only" };
    const token = await createOwnerSession(config, db);
    const headers = new Headers({ cookie: ownerCookie(token) });
    assert.deepEqual(await sessionOwner(headers, config, db), { email: config.email });
    assert.equal(await sessionOwner(headers, { ...config, version: "rotated" }, db), null);
    assert.equal(await sessionOwner(new Headers({ cookie: ownerCookie("b".repeat(64)) }), config, db), null);
    assert.equal((await db.prepare("SELECT token_hash FROM asal_owner_sessions").first()).token_hash, createHash("sha256").update(token).digest("hex"));
    await revokeOwnerSession(headers, db);
    assert.equal(await sessionOwner(headers, config, db), null);
    const expired = await createOwnerSession(config, db);
    await db.prepare("UPDATE asal_owner_sessions SET expires_at=1").run();
    assert.equal(await sessionOwner(new Headers({ cookie: ownerCookie(expired) }), config, db), null);
    const decisions = await Promise.all(Array.from({ length: 12 }, () => allowLogin("192.0.2.1", db, 900)));
    assert.equal(decisions.filter(Boolean).length, 10);
    assert.equal(await allowLogin("192.0.2.1", db, 1800), true);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldStorage === undefined) delete process.env.ORDER_STORAGE; else process.env.ORDER_STORAGE = oldStorage;
    for (const key of envKeys) if (oldEnv[key] === undefined) delete process.env[key]; else process.env[key] = oldEnv[key];
    globalThis[Symbol.for("__cloudflare-context__")] = oldContext;
    await mf.dispose();
  }
});
