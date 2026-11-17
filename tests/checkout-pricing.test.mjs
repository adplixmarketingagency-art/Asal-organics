import assert from "node:assert/strict";
import test from "node:test";
import { getCartSummary } from "../src/lib/cart.ts";
import { products, productVariantsFor } from "../src/content/products.ts";
import { getCheckoutPricing, formatMoneyPaise } from "../src/lib/checkout-pricing.ts";
import { readFileSync } from "node:fs";

const price = (items) => getCheckoutPricing(getCartSummary(items));

test("one litre of groundnut oil adds 5% GST and one tax-inclusive ₹49 delivery charge", () => {
  const pricing = price([{ productId: "groundnut", quantity: 1 }]);
  assert.equal(pricing.subtotalPaise, 42000);
  assert.equal(pricing.oilGstPaise, 2100);
  assert.equal(pricing.deliveryPaise, 4900);
  assert.equal(pricing.deliveryGstIncludedPaise, 233);
  assert.equal(pricing.totalPaise, 49000);
  assert.equal(pricing.taxStatus, "oil_rates_verified");
});

test("every cold- and wood-pressed oil pack uses 5%, with delivery once regardless of quantity", () => {
  const oils = products.filter(({ category }) => ["oils", "wood-oils"].includes(category));
  assert.equal(oils.length, 6);
  for (const product of oils) for (const variant of productVariantsFor(product)) {
    const pricing = price([{ productId: product.id, variantId: variant.id, quantity: 3 }]);
    assert.equal(pricing.oilGstPaise, Math.round(variant.price * 300 * 0.05));
    assert.equal(pricing.deliveryPaise, 4900);
    assert.equal(pricing.totalPaise, variant.price * 300 + pricing.oilGstPaise + 4900);
  }
  const multiple = price(oils.map(({ id }) => ({ productId: id, quantity: 1 })));
  assert.equal(multiple.deliveryPaise, 4900);
});

test("mixed and non-oil bags do not imply unverified products are exempt or taxed at 5%", () => {
  const pricing = price([{ productId: "groundnut", quantity: 1 }, { productId: "paneer", quantity: 1 }]);
  assert.equal(pricing.oilSubtotalPaise, 42000);
  assert.equal(pricing.oilGstPaise, 2100);
  assert.equal(pricing.totalPaise, 140000);
  assert.equal(pricing.taxStatus, "partially_configured");
  assert.deepEqual(pricing.pendingTaxProductIds, ["paneer"]);
  assert.equal(pricing.deliveryGstIncludedPaise, null);
  const nonOil = price([{ productId: "paneer", quantity: 1 }]);
  assert.equal(nonOil.oilGstPaise, 0);
  assert.equal(nonOil.taxStatus, "partially_configured");
});

test("empty bags have no delivery or tax and totals retain exact paise", () => {
  const empty = price([]);
  assert.equal(empty.subtotalPaise, 0);
  assert.equal(empty.oilGstPaise, 0);
  assert.equal(empty.deliveryPaise, 0);
  assert.equal(empty.totalPaise, 0);
  assert.equal(formatMoneyPaise(49000), "₹490");
  assert.equal(formatMoneyPaise(233), "₹2.33");
  assert.equal(formatMoneyPaise(49001), "₹490.01");
});

test("checkout renders the reviewed breakdown and compares payment to the full total", () => {
  const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const summary = source("src/components/CommerceLayout.tsx");
  assert.match(summary, /pricing\.oilGstPaise/);
  assert.match(summary, /pricing\.deliveryPaise/);
  assert.match(summary, /pricing\.totalPaise/);
  assert.doesNotMatch(summary, /To be confirmed|Estimated subtotal/);
  assert.match(source("src/components/CheckoutPage.tsx"), /result\.amount !== currentReview\.pricing\.totalPaise/);
  assert.match(source("src/components/AdminOrders.tsx"), /detail\.pricing\.oilGstPaise/);
  for (const file of ["ProductCard.tsx", "ProductPurchase.tsx", "StorefrontDialogs.tsx"]) {
    assert.match(source(`src/components/${file}`), /oilTaxNote/);
  }
});
