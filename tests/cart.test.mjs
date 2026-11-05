import assert from "node:assert/strict";
import test from "node:test";
import { addCartItem, getCartSummary, MAX_ITEM_QUANTITY, normalizeCart, parseStoredCart, serializeCart, setCartQuantity } from "../src/lib/cart.ts";

test("adding migrates legacy products to their original base pack without mutating the bag", () => {
  const original = [{ productId: "sesame", quantity: 1 }];
  const added = addCartItem(original, "sesame");
  assert.deepEqual(added, [{ productId: "sesame", variantId: "sesame:1l", quantity: 2 }]);
  assert.equal(original[0].quantity, 1);
  assert.equal(addCartItem(added, "groundnut").length, 2);
  assert.deepEqual(addCartItem(original, "unknown"), normalizeCart(original));
});

test("quantities are bounded, integer-only, and zero removes an item", () => {
  const items = [{ productId: "sesame", quantity: 1 }];
  for (const value of [-1, 1.2, NaN, Infinity, "2", null]) {
    assert.deepEqual(setCartQuantity(items, "sesame", value), normalizeCart(items));
  }
  assert.deepEqual(setCartQuantity(items, "sesame", 0), []);
  assert.equal(setCartQuantity(items, "sesame", 1000)[0].quantity, MAX_ITEM_QUANTITY);
  assert.equal(addCartItem([{ productId: "sesame", quantity: 99 }], "sesame")[0].quantity, 99);
});

test("untrusted stored data drops unknown products and invalid values", () => {
  assert.deepEqual(normalizeCart([
    { productId: "sesame", quantity: 2, price: 1 },
    { productId: "sesame", quantity: 3 },
    { productId: "unknown", quantity: 1 },
    { productId: "groundnut", quantity: -2 },
    { productId: "coconut", quantity: "3" }, null, false,
  ]), [{ productId: "sesame", variantId: "sesame:1l", quantity: 5 }]);
  for (const input of [null, "broken", "[]", '{"version":3,"items":[]}', '{"version":1,"items":null}']) {
    assert.deepEqual(parseStoredCart(input), []);
  }
});

test("storage only contains versioned IDs and quantities", () => {
  const original = [{ productId: "coconut", quantity: 3, price: 1, email: "do-not-store@example.com" }];
  const serialized = serializeCart(original);
  assert.equal(serialized.includes("email"), false);
  assert.equal(serialized.includes("price"), false);
  assert.equal(JSON.parse(serialized).version, 2);
  assert.deepEqual(parseStoredCart(serialized), [{ productId: "coconut", variantId: "coconut:1l", quantity: 3 }]);
});

test("different packs remain separate and quantity controls target only the selected pack", () => {
  let items = addCartItem([], "groundnut", "groundnut:500ml");
  items = addCartItem(items, "groundnut", "groundnut:1l");
  items = addCartItem(items, "groundnut", "groundnut:500ml");
  assert.deepEqual(items, [
    { productId: "groundnut", variantId: "groundnut:500ml", quantity: 2 },
    { productId: "groundnut", variantId: "groundnut:1l", quantity: 1 },
  ]);
  assert.equal(getCartSummary(items).subtotalPaise, 84000);
  items = setCartQuantity(items, "groundnut", 3, "groundnut:500ml");
  assert.equal(getCartSummary(items).subtotalPaise, 105000);
  assert.deepEqual(setCartQuantity(items, "groundnut", 0, "groundnut:500ml"), [items[1]]);
  assert.deepEqual(parseStoredCart(serializeCart(items)), items);
});

test("legacy storage preserves base quantities and merges duplicate canonical packs", () => {
  const items = parseStoredCart(JSON.stringify({ version: 1, items: [
    { productId: "sesame", quantity: 2 },
    { productId: "sesame", variantId: "sesame:1l", quantity: 3 },
  ] }));
  assert.deepEqual(items, [{ productId: "sesame", variantId: "sesame:1l", quantity: 5 }]);
});

test("cold-pressed and wood-pressed oils remain separate through bag storage and quantity changes", () => {
  let items = addCartItem([], "groundnut", "groundnut:500ml");
  items = addCartItem(items, "wood-groundnut", "wood-groundnut:500ml");
  items = addCartItem(items, "wood-sesame", "wood-sesame:2l");
  assert.equal(items.length, 3);
  assert.equal(getCartSummary(items).subtotalPaise, 154000);
  assert.deepEqual(parseStoredCart(serializeCart(items)), items);
  items = setCartQuantity(items, "wood-groundnut", 2, "wood-groundnut:500ml");
  assert.equal(items[0].quantity, 1);
  assert.equal(items[1].quantity, 2);
  assert.equal(getCartSummary(items).subtotalPaise, 175000);
  assert.deepEqual(addCartItem([], "wood-groundnut", "groundnut:500ml"), []);
  assert.deepEqual(addCartItem([], "groundnut", "wood-groundnut:500ml"), []);
});

test("forged and cross-product variant IDs are discarded, never replaced by a base pack", () => {
  for (const variantId of ["sesame:500ml", "groundnut:100ml", "", null, 1, {}]) {
    assert.deepEqual(normalizeCart([{ productId: "groundnut", variantId, quantity: 1 }]), []);
    assert.deepEqual(addCartItem([], "groundnut", variantId), []);
  }
  const summary = getCartSummary([{ productId: "curry-masala", variantId: "curry-masala:250g", quantity: 2, price: 1, unitPricePaise: 1 }]);
  assert.equal(summary.subtotalPaise, 24000);
  assert.equal(summary.lines[0].variant.size, "250 g");
});

test("totals use integer paise and current catalogue prices", () => {
  const result = getCartSummary([{ productId: "sesame", quantity: 2 }, { productId: "groundnut", quantity: 1 }]);
  assert.equal(result.itemCount, 3);
  assert.equal(result.subtotalPaise, 154000);
  assert.equal("savingsPaise" in result, false);
  assert.equal(result.lines[0].lineTotalPaise, 112000);
  assert.deepEqual(getCartSummary([]), { lines: [], itemCount: 0, subtotalPaise: 0 });
});


test("retired products and missing-unit products cannot enter a bag", () => {
  for (const productId of ["sunflower", "castor", "almond", "ragi", "bajra"]) {
    assert.deepEqual(addCartItem([], productId), []);
    assert.deepEqual(setCartQuantity([], productId, 2), []);
    assert.deepEqual(normalizeCart([{ productId, quantity: 1 }]), []);
  }
  const summary = getCartSummary([{ productId: "bilona-ghee", quantity: 2 }, { productId: "karuppu-kavuni", quantity: 1 }]);
  assert.equal(summary.subtotalPaise, 405500);
});
