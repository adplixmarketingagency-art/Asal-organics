import assert from "node:assert/strict";
import test from "node:test";
import { prepareCheckoutReview, validateCheckoutDetails } from "../src/lib/checkout.ts";
import { POST } from "../src/app/api/checkout/route.ts";

const customer = {
  fullName: "Test Customer", email: "checkout@example.com", phone: "+91 98765 43210",
  address: "12 Test Street", apartment: "", city: "Chennai", state: "Tamil Nadu", pincode: "600001", country: "IN",
};
const payload = { customer, items: [{ productId: "sesame", quantity: 2 }, { productId: "groundnut", quantity: 1 }] };

test("valid Indian address and phone are normalized without altering the input", () => {
  const result = validateCheckoutDetails({ ...customer, fullName: "  Test Customer  " });
  assert.deepEqual(result.errors, {});
  assert.equal(result.details.fullName, "Test Customer");
  assert.equal(result.details.phone, "9876543210");
  assert.equal(customer.phone, "+91 98765 43210");
});

test("delivery validation reports each malformed field", () => {
  const result = validateCheckoutDetails({
    fullName: "", email: "not-an-email", phone: "1111111111", address: "abc",
    apartment: "x".repeat(101), city: "A", state: "Unknown", pincode: "000000", country: "US",
  });
  assert.equal(Object.keys(result.errors).length, 9);
  assert.equal(Object.keys(validateCheckoutDetails(null).errors).length, 8);
});

test("checkout ignores forged prices and does not claim payment, order creation or delivery", () => {
  const result = prepareCheckoutReview({
    ...payload, subtotalPaise: 1, currency: "USD", paid: true,
    items: payload.items.map((item) => ({ ...item, price: 1, unitPricePaise: 1 })),
  });
  assert.equal(result.ok, true);
  assert.equal(result.review.summary.subtotalPaise, 167700);
  assert.equal(result.review.currency, "INR");
  assert.deepEqual(result.review.payment, { provider: "razorpay", enabled: false });
  assert.equal(result.review.shipping, "not_configured");
  assert.equal(result.review.tax, "not_configured");
  assert.equal("orderId" in result.review, false);
});

test("checkout strictly rejects empty, unknown, duplicate and invalid cart lines", () => {
  for (const items of [
    [], [{ productId: "unknown", quantity: 1 }],
    [{ productId: "sesame", quantity: 0 }], [{ productId: "sesame", quantity: -1 }],
    [{ productId: "sesame", quantity: 1.5 }], [{ productId: "sesame", quantity: 100 }],
    [{ productId: "sesame", quantity: "1" }], [null],
    [{ productId: "sesame", quantity: 1 }, { productId: "sesame", quantity: 2 }],
  ]) assert.equal(prepareCheckoutReview({ customer, items }).ok, false);
});

test("checkout API validates and returns a no-store review", async () => {
  const response = await POST(new Request("http://localhost/api/checkout", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await response.json()).summary.subtotalPaise, 167700);
});

test("checkout API rejects invalid content, JSON, sizes and details", async () => {
  for (const [body, contentType, status] of [
    [JSON.stringify(payload), "text/plain", 415],
    ["{", "application/json", 400],
    ["x".repeat(16385), "application/json", 413],
    [JSON.stringify({ customer: {}, items: payload.items }), "application/json", 422],
    [JSON.stringify({ customer, items: [] }), "application/json", 422],
  ]) {
    const response = await POST(new Request("http://localhost/api/checkout", {
      method: "POST", headers: { "Content-Type": contentType }, body,
    }));
    assert.equal(response.status, status);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});
