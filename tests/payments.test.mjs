import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createPaymentHandlers } from "../src/lib/payment-handlers.ts";
import { paymentConfig } from "../src/lib/payment-config.ts";
import { signPaymentOrder, readPaymentOrder } from "../src/lib/payment-order-token.ts";
import { isValidPaymentAmount, validHmac } from "../src/lib/razorpay.ts";

const secret = "dummy-test-only-secret";
const customer = {
  fullName: "Test Customer", email: "checkout@example.com", phone: "9876543210",
  address: "12 Test Street", apartment: "", city: "Chennai",
  state: "Tamil Nadu", pincode: "600001", country: "IN",
};
const checkout = { customer, items: [{ productId: "sesame", quantity: 2 }, { productId: "groundnut", quantity: 1 }] };
const order = { orderId: "order_test123", merchantOrderId: null, amount: 154000, currency: "INR", mode: "test" };
const captured = { id: "pay_test123", order_id: order.orderId, amount: order.amount, currency: "INR", status: "captured" };
const config = { enabled: true, mode: "test", keyId: "rzp_test_dummy", keySecret: secret, databaseUrl: "", webhookSecret: "", catalogueApproved: false, purchaseTotalApproved: false };
const signature = (id = order.orderId, payment = captured.id) => createHmac("sha256", secret).update(`${id}|${payment}`).digest("hex");
function confirmation(snapshot = order) {
  return { razorpay_order_id: snapshot.orderId, razorpay_payment_id: captured.id, razorpay_signature: signature(snapshot.orderId), orderToken: signPaymentOrder(snapshot, secret) };
}
function request(body, overrides = {}) {
  return new Request("http://localhost:3101/api/create-order", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost:3101" },
    body: JSON.stringify(body), ...overrides,
  });
}
function fixture(overrides = {}) {
  const calls = [];
  const deps = {
    paymentConfig: () => config,
    createPendingOrder: async () => { calls.push("store"); throw new Error("Sandbox must not touch database"); },
    attachRazorpayOrder: async () => { calls.push("attach"); return true; },
    getOrder: async () => { calls.push("lookup"); return null; },
    markPaid: async () => { calls.push("paid"); return true; },
    createRazorpayOrder: async (_config, amount, receipt) => {
      calls.push({ amount, receipt }); return { id: order.orderId, amount, currency: "INR" };
    },
    fetchRazorpayPayment: async () => { calls.push("fetch"); return captured; },
    ...overrides,
  };
  return { ...createPaymentHandlers(deps), calls };
}

test("payment configuration allows sandbox but cannot sell the catalogue with unverified labels", async () => {
  const names = ["PAYMENTS_ENABLED", "PAYMENT_MODE", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "DATABASE_URL", "RAZORPAY_WEBHOOK_SECRET", "CATALOGUE_APPROVED", "PURCHASE_TOTAL_APPROVED", "ORDER_STORAGE"];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    assert.equal(paymentConfig().enabled, false);
    Object.assign(process.env, { PAYMENTS_ENABLED: "true", PAYMENT_MODE: "test", RAZORPAY_KEY_ID: config.keyId, RAZORPAY_KEY_SECRET: secret });
    assert.equal(paymentConfig().enabled, true);
    process.env.PAYMENT_MODE = "live";
    assert.equal(paymentConfig().enabled, false);
    process.env.RAZORPAY_KEY_ID = "rzp_live_dummy";
    assert.equal(paymentConfig().enabled, false);
    Object.assign(process.env, { DATABASE_URL: "postgres://example.invalid/test", RAZORPAY_WEBHOOK_SECRET: "dummy", CATALOGUE_APPROVED: "true", PURCHASE_TOTAL_APPROVED: "true" });
    assert.equal(paymentConfig().enabled, false, "environment approvals cannot bypass the pending food-label review");
    for (const storage of ["postgres", "d1"]) {
      process.env.ORDER_STORAGE = storage;
      const api = fixture({ paymentConfig });
      for (const handler of [api.createOrder, api.verifyPayment]) {
        assert.equal((await handler(request(checkout))).status, 503);
      }
      assert.deepEqual(api.calls, [], "unverified labels must prevent provider and storage calls");
    }
    process.env.PAYMENTS_ENABLED = "false";
    assert.equal(paymentConfig().enabled, false);
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name];
    }
  }
});

test("amounts must be safe integer paise, minimum 100", () => {
  for (const amount of [null, undefined, "100", 99, -100, 100.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.equal(isValidPaymentAmount(amount), false);
  assert.equal(isValidPaymentAmount(100), true);
});

test("HMAC verifies exact server order/payment pair and rejects malformed signatures", () => {
  assert.equal(validHmac(`${order.orderId}|${captured.id}`, signature(), secret), true);
  assert.equal(validHmac(`${order.orderId}|pay_other`, signature(), secret), false);
  for (const value of ["", "0", "z".repeat(64), "0".repeat(64), signature() + "00"]) assert.equal(validHmac(`${order.orderId}|${captured.id}`, value, secret), false);
});

test("server order reference is signed, expires and contains no customer details", () => {
  const token = signPaymentOrder(order, secret, 1000);
  assert.deepEqual(readPaymentOrder(token, secret, 2000), { ...order, expires: 86401000 });
  assert.equal(readPaymentOrder(token, secret, 86401000), null);
  assert.equal(readPaymentOrder(token, "wrong-secret", 2000), null);
  const [body, mac] = token.split(".");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  assert.equal("customer" in payload, false);
  assert.equal(readPaymentOrder(`${Buffer.from(JSON.stringify({ ...payload, amount: 100 })).toString("base64url")}.${mac}`, secret, 2000), null);
  assert.equal(readPaymentOrder(token + ".extra", secret, 2000), null);
  assert.equal(readPaymentOrder("x".repeat(2049), secret), null);
});

test("disabled routes return 503 without contacting provider", async () => {
  const api = fixture({ paymentConfig: () => ({ ...config, enabled: false }) });
  for (const handler of [api.createOrder, api.verifyPayment]) assert.equal((await handler(request({}))).status, 503);
  assert.deepEqual(api.calls, []);
});

test("create uses catalogue prices, bounded server receipt and sandbox never writes to database", async () => {
  const api = fixture();
  const response = await api.createOrder(request({ ...checkout, receipt: "browser-controlled", items: checkout.items.map((item) => ({ ...item, price: 1 })) }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.deepEqual({ order_id: body.order_id, amount: body.amount, currency: body.currency }, { order_id: order.orderId, amount: 154000, currency: "INR" });
  assert.equal(body.key_id, config.keyId);
  assert.equal(body.mode, "test");
  assert.equal(readPaymentOrder(body.orderToken, secret).amount, 154000);
  assert.equal(JSON.stringify(body).includes(secret), false);
  assert.equal(api.calls.length, 1);
  assert.match(api.calls[0].receipt, /^asal_/);
  assert.ok(api.calls[0].receipt.length <= 40);
});

test("create rejects forged, fractional, too-small and non-INR browser totals", async () => {
  for (const extra of [{ amount: 99 }, { amount: 154000.5 }, { amount: "154000" }, { amount: 100 }, { currency: "USD" }]) {
    const api = fixture();
    assert.equal((await api.createOrder(request({ ...checkout, ...extra }))).status, 400);
    assert.deepEqual(api.calls, []);
  }
});

test("create sends the selected pack total to Razorpay and signs that exact amount", async () => {
  const api = fixture();
  const response = await api.createOrder(request({ customer, items: [
    { productId: "groundnut", variantId: "groundnut:500ml", quantity: 2, price: 1 },
    { productId: "curry-masala", variantId: "curry-masala:250g", quantity: 1, unitPricePaise: 1 },
  ] }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.amount, 54000);
  assert.equal(api.calls[0].amount, 54000);
  assert.equal(readPaymentOrder(body.orderToken, secret).amount, 54000);
});

test("create rejects forged pack IDs before contacting Razorpay", async () => {
  for (const variantId of ["sesame:500ml", "groundnut:1ml", null]) {
    const api = fixture();
    assert.equal((await api.createOrder(request({ customer, items: [{ productId: "groundnut", variantId, quantity: 1 }] }))).status, 422);
    assert.deepEqual(api.calls, []);
  }
});

test("wood-pressed order creation uses canonical pack prices without conflating cold-pressed oils", async () => {
  const api = fixture();
  const response = await api.createOrder(request({ customer, items: [
    { productId: "groundnut", variantId: "groundnut:500ml", quantity: 1 },
    { productId: "wood-groundnut", variantId: "wood-groundnut:500ml", quantity: 1, price: 1 },
    { productId: "wood-sesame", variantId: "wood-sesame:2l", quantity: 1 },
  ] }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.amount, 154000);
  assert.equal(api.calls[0].amount, 154000);
  assert.equal(readPaymentOrder(body.orderToken, secret).amount, 154000);
  const invalid = fixture();
  assert.equal((await invalid.createOrder(request({ customer, items: [
    { productId: "wood-groundnut", variantId: "groundnut:500ml", quantity: 1 },
  ] }))).status, 422);
  assert.deepEqual(invalid.calls, []);
});

test("create revalidates customers and unpurchasable or empty bags", async () => {
  for (const body of [{ ...checkout, customer: {} }, { ...checkout, items: [] }, { ...checkout, items: [{ productId: "ragi", variantId: "ragi:100g", quantity: 1 }] }]) {
    const api = fixture();
    assert.equal((await api.createOrder(request(body))).status, 422);
    assert.deepEqual(api.calls, []);
  }
});

test("payment routes reject malformed, oversized and cross-origin requests", async () => {
  for (const handlerName of ["createOrder", "verifyPayment"]) {
    for (const [req, status] of [
      [request(null), 400], [request([]), 400], [request({}, { body: "not json" }), 400],
      [request({}, { body: null }), 400], [request({ data: "x".repeat(17000) }), 413],
      [request(checkout, { headers: { "Content-Type": "text/plain" } }), 415],
      [request(checkout, { headers: { "Content-Type": "application/json", Origin: "https://evil.example" } }), 403],
    ]) {
      const api = fixture();
      assert.equal((await api[handlerName](req)).status, status);
      assert.deepEqual(api.calls, []);
    }
  }
});

test("same-origin requests work when Next uses its bind address behind the request Host", async () => {
  const api = fixture();
  const response = await api.createOrder(new Request("http://0.0.0.0:3101/api/create-order", {
    method: "POST", headers: { "Content-Type": "application/json", Host: "localhost:3101", Origin: "http://localhost:3101", "x-forwarded-proto": "http" },
    body: JSON.stringify(checkout),
  }));
  assert.equal(response.status, 200);
});

test("provider auth failures are 401, other errors 500, never leak SDK credentials", async () => {
  for (const statusCode of [401, 400, 429, 500]) {
    const api = fixture({ createRazorpayOrder: async () => { throw { statusCode, error: { secret } }; } });
    const response = await api.createOrder(request(checkout));
    assert.equal(response.status, statusCode === 401 ? 401 : 500);
    assert.equal((await response.text()).includes(secret), false);
  }
});

test("create rejects a provider response with the wrong amount or currency", async () => {
  for (const changed of [{ amount: 100 }, { currency: "USD" }, { id: "invalid" }]) {
    const api = fixture({ createRazorpayOrder: async () => ({ id: order.orderId, amount: order.amount, currency: "INR", ...changed }) });
    assert.equal((await api.createOrder(request(checkout))).status, 500);
  }
});

test("verification requires all callback fields plus the trusted order reference", async () => {
  for (const field of Object.keys(confirmation())) {
    const body = confirmation(); delete body[field];
    const api = fixture();
    assert.equal((await api.verifyPayment(request(body))).status, 400);
    assert.deepEqual(api.calls, []);
  }
});

test("verification rejects mismatched order, bad signature, expired token and wrong mode before provider calls", async () => {
  for (const changed of [
    { razorpay_order_id: "order_other" }, { razorpay_signature: "0".repeat(64) },
    { orderToken: signPaymentOrder(order, secret, 0) },
    { orderToken: signPaymentOrder({ ...order, mode: "live" }, secret) },
  ]) {
    const api = fixture();
    assert.equal((await api.verifyPayment(request({ ...confirmation(), ...changed }))).status, 400);
    assert.deepEqual(api.calls, []);
  }
});

test("captured payment with matching amount/order verifies without creating a sandbox merchant order", async () => {
  const api = fixture();
  const response = await api.verifyPayment(request(confirmation()));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, mode: "test", order_id: order.orderId, payment_id: captured.id, orderPlaced: false });
  assert.deepEqual(api.calls, ["fetch"]);
});

test("a valid signature alone is insufficient: amount, currency, order and captured status must match", async () => {
  for (const [changed, status] of [[{ id: "pay_other" }, 400], [{ amount: 100 }, 400], [{ currency: "USD" }, 400], [{ order_id: "order_other" }, 400], [{ status: "authorized" }, 409], [{ status: "failed" }, 409]]) {
    const api = fixture({ fetchRazorpayPayment: async () => ({ ...captured, ...changed }) });
    assert.equal((await api.verifyPayment(request(confirmation()))).status, status);
    assert.equal(api.calls.includes("paid"), false);
  }
});

test("verification handles provider authentication and connection failures", async () => {
  for (const statusCode of [401, 500]) {
    const api = fixture({ fetchRazorpayPayment: async () => { throw { statusCode }; } });
    assert.equal((await api.verifyPayment(request(confirmation()))).status, statusCode);
    assert.equal(api.calls.includes("paid"), false);
  }
});

const liveOrder = { ...order, mode: "live", merchantOrderId: "00000000-0000-4000-8000-000000000001" };
const stored = { id: liveOrder.merchantOrderId, razorpayOrderId: order.orderId, amountPaise: order.amount, currency: "INR", status: "pending", paymentId: null };
const liveConfig = { ...config, mode: "live", keyId: "rzp_live_dummy" };

test("live create attaches the provider order to the existing durable order model", async () => {
  const api = fixture({ paymentConfig: () => liveConfig, createPendingOrder: async () => stored });
  const response = await api.createOrder(request(checkout));
  assert.equal(response.status, 200);
  assert.equal(readPaymentOrder((await response.json()).orderToken, secret).merchantOrderId, stored.id);
  assert.ok(api.calls.includes("attach"));
});

test("live create never opens a provider order if merchant persistence failed", async () => {
  const api = fixture({ paymentConfig: () => liveConfig, createPendingOrder: async () => null });
  assert.equal((await api.createOrder(request(checkout))).status, 500);
  assert.deepEqual(api.calls, []);
});

test("live verification requires the original stored order and successful atomic payment transition", async () => {
  const api = fixture({ paymentConfig: () => liveConfig, getOrder: async () => stored });
  const response = await api.verifyPayment(request(confirmation(liveOrder)));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).orderPlaced, true);
  assert.ok(api.calls.includes("paid"));
  for (const record of [null, { ...stored, amountPaise: 100 }, { ...stored, razorpayOrderId: "order_other" }]) {
    const missing = fixture({ paymentConfig: () => liveConfig, getOrder: async () => record });
    assert.equal((await missing.verifyPayment(request(confirmation(liveOrder)))).status, 404);
    assert.equal(missing.calls.includes("paid"), false);
  }
  const conflict = fixture({ paymentConfig: () => liveConfig, getOrder: async () => stored, markPaid: async () => false });
  assert.equal((await conflict.verifyPayment(request(confirmation(liveOrder)))).status, 409);
});

test("live verification rejects a different previously recorded payment", async () => {
  const api = fixture({ paymentConfig: () => liveConfig, getOrder: async () => ({ ...stored, status: "paid", paymentId: "pay_different" }) });
  assert.equal((await api.verifyPayment(request(confirmation(liveOrder)))).status, 409);
  assert.equal(api.calls.includes("paid"), false);
});
