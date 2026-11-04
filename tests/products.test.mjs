import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { products, productCategories, selectProducts, formatPrice, canAddToBag, quantityLabel, catalogueMaxPrice } from "../src/content/products.ts";

const expected = [
  ["groundnut", "Groundnut Oil", 420, "1 Litre", "oils"],
  ["sesame", "Sesame Oil", 560, "1 Litre", "oils"],
  ["coconut", "Coconut Oil", 420, "1 Litre", "oils"],
  ["turmeric", "Turmeric", 560, "1 kg", "masala"],
  ["curry-masala", "South Indian All Purpose Curry Masala", 478, "1 kg", "masala"],
  ["chilli-powder", "Chilli Powder", 560, "1 kg", "masala"],
  ["coriander-powder", "Coriander Powder", 410, "1 kg", "masala"],
  ["ragi", "Ragi", 95, null, "grain"], ["bajra", "Bajra", 73, null, "grain"],
  ["bilona-ghee", "Bilona Ghee", 1930, "1 Litre", "milk"],
  ["bilona-butter", "Bilona Butter", 1820, "1 kg", "milk"],
  ["palkova", "Palkova", 650, "1 kg", "milk"],
  ["karuppu-kavuni-halwa", "Karuppu Kavuni Halwa", 520, "1 kg", "milk"],
  ["paneer", "Paneer", 910, "1 kg", "milk"],
  ["karuppu-kavuni", "Karuppu Kavuni", 195, "1 kg", "rice"],
  ["mapillai-samba", "Mapillai Samba", 130, "1 kg", "rice"],
  ["seera-samba", "Seera Samba (Vasanai)", 156, "1 kg", "rice"],
];

test("only the 17 owner-listed products, selling prices and quantities are present", () => {
  assert.deepEqual(products.map(({ id, name, price, size, category }) => [id, name, price, size, category]), expected);
  assert.equal(new Set(products.map(({ id }) => id)).size, 17);
  for (const product of products) {
    for (const field of ["image", "source", "originalPrice", "productionCost"]) assert.equal(field in product, false);
  }
});

test("the five listed categories contain exactly the supplied products", () => {
  assert.deepEqual(productCategories.map(({ id }) => [id, selectProducts(products, { category: id }).length]), [["oils", 3], ["masala", 4], ["grain", 2], ["milk", 5], ["rice", 3]]);
});

test("no unit is invented for grain flour", () => {
  for (const product of products.filter(({ category }) => category === "grain")) {
    assert.equal(quantityLabel(product), "Quantity not specified");
    assert.equal(canAddToBag(product), false);
  }
  assert.equal(products.filter(canAddToBag).length, 15);
});

test("search handles names, Tamil names and categories without hiding higher prices", () => {
  assert.deepEqual(selectProducts(products, { query: "  COCONUT  " }).map(({ id }) => id), ["coconut"]);
  assert.deepEqual(selectProducts(products, { query: "பால்கோவா" }).map(({ id }) => id), ["palkova"]);
  assert.equal(selectProducts(products, { query: "rice" }).length, 3);
  assert.equal(selectProducts(products, { query: "ghee" })[0].price, 1930);
  assert.equal(selectProducts(products, { query: "no matching product" }).length, 0);
  assert.equal(selectProducts(products, {}).length, 17);
  assert.equal(catalogueMaxPrice, 1930);
});

test("price, search, category and saved filters compose", () => {
  assert.deepEqual(selectProducts(products, { category: "oils", maxPrice: 500 }).map(({ id }) => id), ["groundnut", "coconut"]);
  assert.equal(selectProducts(products, { category: "milk", query: "coconut" }).length, 0);
  assert.equal(selectProducts(products, { maxPrice: 72 }).length, 0);
  assert.deepEqual(selectProducts(products, { category: "saved", saved: ["coconut", "almond"] }).map(({ id }) => id), ["coconut"]);
  assert.equal(selectProducts(products, { category: "saved" }).length, 0);
});

test("sorting preserves the source order and includes the full price range", () => {
  const original = products.map(({ id }) => id);
  const prices = products.map(({ price }) => price);
  assert.deepEqual(selectProducts(products, { sort: "price-asc" }).map(({ price }) => price), [...prices].sort((a,b) => a-b));
  assert.deepEqual(selectProducts(products, { sort: "price-desc" }).map(({ price }) => price), [...prices].sort((a,b) => b-a));
  assert.equal(selectProducts(products, { sort: "name" })[0].name, "Bajra");
  assert.deepEqual(products.map(({ id }) => id), original);
});

test("removed brand, products and photos cannot return through storefront components", () => {
  const files = readdirSync(new URL("../src/components/", import.meta.url)).filter((name) => name.endsWith(".tsx"));
  for (const file of files) {
    const source = readFileSync(new URL(`../src/components/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /aishw(?:a|ari)|sunflower|castor|almond|product\.image|originalPrice|images\/products|images\/hero/i, file);
  }
  const assets = readdirSync(new URL("../public/", import.meta.url), { recursive: true });
  assert.equal(assets.some((name) => /\.(jpg|jpeg|png|webp)$/i.test(name)), false);
});

test("prices use Indian rupee formatting", () => {
  assert.equal(formatPrice(420), "₹420");
  assert.equal(formatPrice(1930), "₹1,930");
});

test("image spaces remain available without restoring the old photographs", () => {
  for (const file of ["ProductCard", "StorefrontDialogs", "CommerceLayout", "Storefront"]) {
    const source = readFileSync(new URL(`../src/components/${file}.tsx`, import.meta.url), "utf8");
    assert.match(source, /<ProductImagePlaceholder/, file);
  }
  const placeholder = readFileSync(new URL("../src/components/ProductImagePlaceholder.tsx", import.meta.url), "utf8");
  assert.match(placeholder, /Photo coming soon/);
  assert.doesNotMatch(placeholder, /<img|<Image\s|https?:\/\//);
});
