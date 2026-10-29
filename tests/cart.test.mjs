import assert from "node:assert/strict";
import test from "node:test";
import { addCartItem, getCartSummary, MAX_ITEM_QUANTITY, normalizeCart, parseStoredCart, serializeCart, setCartQuantity } from "../src/lib/cart.ts";

test("adding merges matching products without mutating the original bag", () => {
  const original = [{ productId: "sesame", quantity: 1 }];
  const added = addCartItem(original, "sesame");
  assert.deepEqual(added, [{ productId: "sesame", quantity: 2 }]);
  assert.equal(original[0].quantity, 1);
  assert.equal(addCartItem(added, "groundnut").length, 2);
  assert.deepEqual(addCartItem(original, "unknown"), original);
});

test("quantities are bounded, integer-only, and zero removes an item", () => {
  const items = [{ productId: "sesame", quantity: 1 }];
  for (const value of [-1, 1.2, NaN, Infinity, "2", null]) {
    assert.deepEqual(setCartQuantity(items, "sesame", value), items);
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
  ]), [{ productId: "sesame", quantity: 5 }]);
  for (const input of [null, "broken", "[]", '{"version":2,"items":[]}', '{"version":1,"items":null}']) {
    assert.deepEqual(parseStoredCart(input), []);
  }
});

test("storage only contains versioned IDs and quantities", () => {
  const original = [{ productId: "coconut", quantity: 3, price: 1, email: "do-not-store@example.com" }];
  const serialized = serializeCart(original);
  assert.equal(serialized.includes("email"), false);
  assert.equal(serialized.includes("price"), false);
  assert.deepEqual(parseStoredCart(serialized), [{ productId: "coconut", quantity: 3 }]);
});

test("totals use integer paise and current catalogue prices", () => {
  const result = getCartSummary([{ productId: "sesame", quantity: 2 }, { productId: "groundnut", quantity: 1 }]);
  assert.equal(result.itemCount, 3);
  assert.equal(result.subtotalPaise, 167700);
  assert.equal(result.savingsPaise, 28000);
  assert.equal(result.lines[0].lineTotalPaise, 119800);
  assert.deepEqual(getCartSummary([]), { lines: [], itemCount: 0, subtotalPaise: 0, savingsPaise: 0 });
});
