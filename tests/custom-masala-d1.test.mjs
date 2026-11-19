import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { prepareCustomMasalaRequest } from "../src/lib/custom-masala-request.ts";
import { saveCustomMasalaRequest, allowCustomMasalaRequest } from "../src/lib/custom-masala-orders.ts";
import { listAdminOrders, getAdminOrder, updateFulfillment } from "../src/lib/admin-orders.ts";
import { attachRazorpayOrder, markPaid } from "../src/lib/orders.ts";

test("D1 custom requests save immutable recipes, appear in admin and cannot become paid orders", async () => {
  const mf = new Miniflare(convertV4MiniflareOptions({
    name: "custom-test", modules: true, script: "export default {fetch(){return new Response('test')}}",
    compatibilityDate: "2026-11-02", d1Databases: ["ASAL_DB"],
  }));
  const db = await mf.getD1Database("ASAL_DB");
  const oldStorage = process.env.ORDER_STORAGE;
  const oldContext = globalThis[Symbol.for("__cloudflare-context__")];
  try {
    for (const migration of ["0001_orders_and_owner.sql", "0002_order_pricing.sql", "0003_custom_masala_requests.sql"]) {
      await db.exec(readFileSync(new URL(`../migrations/${migration}`, import.meta.url), "utf8")
        .replace(/--[^\n]*/g, "").replace(/\n/g, " "));
    }
    globalThis[Symbol.for("__cloudflare-context__")] = { env: { ASAL_DB: db } };
    process.env.ORDER_STORAGE = "d1";
    const customer = { fullName: "Synthetic Custom Customer", email: "", phone: "9876543210", address: "12 Test Street",
      apartment: "", city: "Chennai", state: "Tamil Nadu", pincode: "600001", country: "IN" };
    const input = { requestId: crypto.randomUUID(), quantities: { coriander: "100", "chilli-long": "200" }, otherIngredients: "Pepper 50 g", customer };
    const prepared = prepareCustomMasalaRequest(input).request;
    const saved = await saveCustomMasalaRequest(prepared);
    assert.equal((await saveCustomMasalaRequest(prepared)).id, saved.id);
    assert.equal((await db.prepare("SELECT count(*) AS n FROM asal_orders").first()).n, 1);
    const detail = await getAdminOrder(saved.id);
    assert.equal(detail.orderKind, "custom");
    assert.equal(detail.status, "pending");
    assert.equal(detail.amountPaise, 10100);
    assert.deepEqual(detail.customRecipe, prepared.recipe);
    assert.deepEqual(detail.customer, customer);
    assert.equal(detail.paymentId, null);
    assert.equal(detail.notification, null);
    const list = await listAdminOrders({ filter: "custom", page: 1, search: "" });
    assert.equal(list.total, 1);
    assert.equal(list.orders[0].orderKind, "custom");
    assert.equal(list.orders[0].customerName, customer.fullName);
    assert.equal(list.orders[0].city, customer.city);
    assert.equal((await listAdminOrders({ filter: "pending", page: 1, search: "" })).total, 0);
    assert.equal(await attachRazorpayOrder(saved.id, "order_custom"), false);
    assert.equal(await markPaid(saved.id, "pay_custom"), false);
    await assert.rejects(updateFulfillment(saved.id, "unfulfilled", "packed", "owner@example.com"), { status: 409 });
    await assert.rejects(saveCustomMasalaRequest(prepareCustomMasalaRequest({ ...input, otherIngredients: "Different note" }).request), { status: 409 });
    await assert.rejects(saveCustomMasalaRequest(prepareCustomMasalaRequest({ ...input, customer: { ...customer, address: "99 Different Street" } }).request), { status: 409 });
    assert.equal((await getAdminOrder(saved.id)).customRecipe.otherIngredients, "Pepper 50 g");
    assert.equal((await db.prepare("SELECT count(*) AS n FROM asal_notification_outbox").first()).n, 0);
    const decisions = await Promise.all(Array.from({ length: 8 }, () => allowCustomMasalaRequest("192.0.2.1", 900)));
    assert.equal(decisions.filter(Boolean).length, 5);
    for (let i = 0; i < 105; i++) assert.equal(await allowCustomMasalaRequest("192.0.2.1", 900), false);
    assert.equal(await allowCustomMasalaRequest("192.0.2.2", 900), true, "rejected IP requests must not consume global capacity");
    for (let i = 0; i < 94; i++) assert.equal(await allowCustomMasalaRequest(`198.51.100.${i}`, 900), true);
    assert.equal(await allowCustomMasalaRequest("203.0.113.1", 900), false, "the global limit still bounds total accepted requests");
    assert.equal(await allowCustomMasalaRequest("192.0.2.1", 1800), true);
  } finally {
    if (oldStorage === undefined) delete process.env.ORDER_STORAGE; else process.env.ORDER_STORAGE = oldStorage;
    globalThis[Symbol.for("__cloudflare-context__")] = oldContext;
    await mf.dispose();
  }
});
