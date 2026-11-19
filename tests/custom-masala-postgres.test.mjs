import assert from "node:assert/strict";
import test from "node:test";
import { prepareCustomMasalaRequest } from "../src/lib/custom-masala-request.ts";
import { saveCustomMasalaRequest, allowCustomMasalaRequest } from "../src/lib/custom-masala-orders.ts";
import { getAdminOrder, listAdminOrders } from "../src/lib/admin-orders.ts";
import { withDatabase, markPaid, attachRazorpayOrder } from "../src/lib/orders.ts";

test("PostgreSQL custom recipe snapshot, replay conflicts and separate rate limits", { skip: !process.env.ADMIN_TEST_DATABASE_URL }, async () => {
  const oldDatabase = process.env.DATABASE_URL;
  const oldStorage = process.env.ORDER_STORAGE;
  process.env.DATABASE_URL = process.env.ADMIN_TEST_DATABASE_URL;
  process.env.ORDER_STORAGE = "postgres";
  const requestId = crypto.randomUUID();
  const prepared = prepareCustomMasalaRequest({
    requestId, quantities: { coriander: "100", "chilli-long": "200" }, otherIngredients: "Synthetic pepper note",
  }).request;
  try {
    const saved = await saveCustomMasalaRequest(prepared);
    assert.equal((await saveCustomMasalaRequest(prepared)).id, saved.id);
    const detail = await getAdminOrder(saved.id);
    assert.equal(detail.orderKind, "custom");
    assert.equal(detail.amountPaise, 10100);
    assert.deepEqual(detail.customRecipe, prepared.recipe);
    assert.equal(detail.status, "pending");
    assert.equal(detail.notification, null);
    assert.equal((await listAdminOrders({ filter: "custom", page: 1, search: saved.receipt })).total, 1);
    assert.equal(await attachRazorpayOrder(saved.id, "order_syntheticcustom"), false);
    assert.equal(await markPaid(saved.id, "pay_syntheticcustom"), false);
    await assert.rejects(saveCustomMasalaRequest({ ...prepared, recipe: { ...prepared.recipe, otherIngredients: "Changed" } }), { status: 409 });
    const ip = `test-${requestId}`;
    const now = 900;
    const decisions = await Promise.all(Array.from({ length: 8 }, () => allowCustomMasalaRequest(ip, now)));
    assert.equal(decisions.filter(Boolean).length, 5);
  } finally {
    await withDatabase((client) => client.query("DELETE FROM asal_orders WHERE id=$1 AND order_kind='custom'", [requestId]));
    if (oldDatabase === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = oldDatabase;
    if (oldStorage === undefined) delete process.env.ORDER_STORAGE; else process.env.ORDER_STORAGE = oldStorage;
  }
});
