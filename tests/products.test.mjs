import assert from "node:assert/strict";
import test from "node:test";
import { products, selectProducts, formatPrice } from "../src/content/products.ts";

test("the collection has six unique products with local imagery and source attribution", () => {
  assert.equal(products.length, 6);
  assert.equal(new Set(products.map((product) => product.id)).size, 6);
  for (const product of products) {
    assert.match(product.image, /^\/images\/products\/.+\.jpg$/);
    assert.match(product.source, /^https:\/\/aishwaryamoils\.com\/products\//);
    assert.ok(product.price > 0 && product.originalPrice >= product.price);
  }
});

test("cooking and topical care remain distinct categories", () => {
  assert.equal(selectProducts(products, { category: "cooking" }).length, 4);
  assert.deepEqual(selectProducts(products, { category: "care" }).map(({ id }) => id), ["castor", "almond"]);
});

test("search trims whitespace and ignores case", () => {
  assert.deepEqual(selectProducts(products, { query: "  COCONUT  " }).map(({ id }) => id), ["coconut"]);
  assert.equal(selectProducts(products, { query: "no matching product" }).length, 0);
});

test("price, search, and category filters compose", () => {
  assert.deepEqual(selectProducts(products, { category: "cooking", maxPrice: 500 }).map(({ id }) => id), ["groundnut"]);
  assert.equal(selectProducts(products, { category: "care", query: "coconut" }).length, 0);
  assert.equal(selectProducts(products, { maxPrice: 100 }).length, 0);
});

test("saved view only includes selected known products", () => {
  assert.deepEqual(selectProducts(products, { category: "saved", saved: ["coconut", "does-not-exist"] }).map(({ id }) => id), ["coconut"]);
  assert.equal(selectProducts(products, { category: "saved" }).length, 0);
});

test("all sort modes are stable and leave source order unchanged", () => {
  const originalOrder = products.map(({ id }) => id);
  assert.deepEqual(selectProducts(products, { sort: "price-asc" }).map(({ price }) => price), [179, 479, 499, 559, 599, 629]);
  assert.deepEqual(selectProducts(products, { sort: "price-desc" }).map(({ price }) => price), [629, 599, 559, 499, 479, 179]);
  assert.equal(selectProducts(products, { sort: "name" })[0].name, "Almond Oil");
  assert.deepEqual(products.map(({ id }) => id), originalOrder);
  assert.deepEqual(selectProducts(products, {}).map(({ id }) => id), originalOrder);
});

test("prices use Indian rupee formatting", () => {
  assert.equal(formatPrice(599), "₹599");
  assert.equal(formatPrice(2299), "₹2,299");
});
