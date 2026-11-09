import assert from "node:assert/strict";
import test from "node:test";
import { prepareCheckoutReview, validateCheckoutDetails } from "../src/lib/checkout.ts";
import { POST } from "../src/app/api/checkout/route.ts";
import { productVariants } from "../src/content/products.ts";

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
  assert.equal(result.review.summary.subtotalPaise, 154000);
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
  assert.equal((await response.json()).summary.subtotalPaise, 154000);
});

test("checkout API rejects invalid content, JSON, sizes and details", async () => {
  for (const [body, contentType, status] of [
    [JSON.stringify(payload), "text/plain", 415],
    [JSON.stringify(payload), "application/jsonfoo", 415],
    [JSON.stringify(payload), "application/json; charset=utf-8", 200],
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


test("server rejects retired products even with a forged size", () => {
  for (const productId of ["sunflower", "almond", "castor"]) {
    assert.equal(prepareCheckoutReview({ customer, items: [{ productId, quantity: 1, size: "1 kg" }] }).ok, false);
  }
});

test("review prices confirmed grain packs on the server, ignoring forged prices", () => {
  const result = prepareCheckoutReview({ customer, items: [
    { productId: "ragi", variantId: "ragi:500g", quantity: 2, price: 1 },
    { productId: "bajra", variantId: "bajra:500g", quantity: 1, price: 1 },
  ] });
  assert.equal(result.ok, true);
  assert.equal(result.review.summary.subtotalPaise, 13300);
  assert.deepEqual(result.review.summary.lines.map(({ variant }) => variant.size), ["500 g", "500 g"]);
});

test("review accepts distinct packs, uses server prices and returns canonical variants", () => {
  const result = prepareCheckoutReview({ customer, items: [
    { productId: "groundnut", variantId: "groundnut:500ml", quantity: 2, price: 1 },
    { productId: "groundnut", variantId: "groundnut:1l", quantity: 1 },
    { productId: "curry-masala", variantId: "curry-masala:250g", quantity: 1, size: "5 Litres" },
  ] });
  assert.equal(result.ok, true);
  assert.equal(result.review.summary.subtotalPaise, 96000);
  assert.deepEqual(result.review.summary.lines.map(({ variantId }) => variantId), ["groundnut:500ml", "groundnut:1l", "curry-masala:250g"]);
  assert.equal(result.review.summary.lines[2].variant.size, "250 g");
});

test("review rejects forged, cross-product, null and duplicate pack IDs", () => {
  for (const variantId of ["sesame:500ml", "groundnut:100ml", "", null, 1, {}]) {
    assert.equal(prepareCheckoutReview({ customer, items: [{ productId: "groundnut", variantId, quantity: 1 }] }).ok, false);
  }
  assert.equal(prepareCheckoutReview({ customer, items: [
    { productId: "groundnut", quantity: 1 },
    { productId: "groundnut", variantId: "groundnut:1l", quantity: 1 },
  ] }).ok, false);
});

test("checkout accepts wood-pressed packs at server prices and rejects swapping pressing methods", () => {
  const result = prepareCheckoutReview({ customer, items: [
    { productId: "groundnut", variantId: "groundnut:500ml", quantity: 1 },
    { productId: "wood-groundnut", variantId: "wood-groundnut:500ml", quantity: 1, price: 1 },
    { productId: "wood-sesame", variantId: "wood-sesame:2l", quantity: 1, unitPricePaise: 1 },
    { productId: "wood-coconut", variantId: "wood-coconut:5l", quantity: 1 },
  ] });
  assert.equal(result.ok, true);
  assert.equal(result.review.summary.subtotalPaise, 364000);
  assert.deepEqual(result.review.summary.lines.map(({ productId }) => productId),
    ["groundnut", "wood-groundnut", "wood-sesame", "wood-coconut"]);
  for (const [productId, variantId] of [
    ["wood-groundnut", "groundnut:500ml"], ["groundnut", "wood-groundnut:500ml"],
  ]) assert.equal(prepareCheckoutReview({ customer, items: [{ productId, variantId, quantity: 1 }] }).ok, false);
});

test("review supports all distinct packs, but never more than the catalogue", () => {
  const items = productVariants.map(({ productId, id: variantId }) => ({ productId, variantId, quantity: 1 }));
  assert.ok(items.length > 17);
  assert.equal(prepareCheckoutReview({ customer, items }).ok, true);
  assert.equal(prepareCheckoutReview({ customer, items: [...items, items[0]] }).ok, false);
});
