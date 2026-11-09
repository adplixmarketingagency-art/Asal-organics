import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { products, productCategories, categoryPackSizes, productPackSizes, productVariantsFor, productVariants, getProductVariant, selectProducts, groupProducts, formatPrice, canAddToBag, quantityLabel, catalogueMaxPrice } from "../src/content/products.ts";

const expected = [
  ["groundnut", "Groundnut Oil", 420, "1 Litre", "oils"],
  ["sesame", "Sesame Oil", 560, "1 Litre", "oils"],
  ["coconut", "Coconut Oil", 420, "1 Litre", "oils"],
  ["wood-groundnut", "Wood-pressed Groundnut Oil", 420, "1 Litre", "wood-oils"],
  ["wood-sesame", "Wood-pressed Sesame Oil", 560, "1 Litre", "wood-oils"],
  ["wood-coconut", "Wood-pressed Coconut Oil", 420, "1 Litre", "wood-oils"],
  ["turmeric", "Turmeric", 560, "1 kg", "masala"],
  ["curry-masala", "South Indian All Purpose Curry Masala", 478, "1 kg", "masala"],
  ["chilli-powder", "Chilli Powder", 560, "1 kg", "masala"],
  ["coriander-powder", "Coriander Powder", 410, "1 kg", "masala"],
  ["ragi", "Ragi", 95, "1 kg", "grain"], ["bajra", "Bajra", 73, "1 kg", "grain"],
  ["bilona-ghee", "Bilona Ghee", 1930, "1 Litre", "ghee"],
  ["bilona-butter", "Bilona Butter", 1820, "1 kg", "milk"],
  ["palkova", "Palkova", 650, "1 kg", "milk"],
  ["karuppu-kavuni-halwa", "Karuppu Kavuni Halwa", 520, "1 kg", "milk"],
  ["paneer", "Paneer", 910, "1 kg", "paneer"],
  ["karuppu-kavuni", "Karuppu Kavuni", 195, "1 kg", "rice"],
  ["mapillai-samba", "Mapillai Samba", 130, "1 kg", "rice"],
  ["seera-samba", "Seera Samba (Vasanai)", 156, "1 kg", "rice"],
];

test("the 20 owner-confirmed products retain their selling prices and quantities", () => {
  assert.deepEqual(products.map(({ id, name, price, size, category }) => [id, name, price, size, category]), expected);
  assert.equal(new Set(products.map(({ id }) => id)).size, 20);
  for (const product of products) {
    for (const field of ["image", "source", "originalPrice", "productionCost"]) assert.equal(field in product, false);
  }
});

test("the owner-confirmed categories keep cold-pressed and wood-pressed oils separate", () => {
  assert.deepEqual(productCategories.map(({ id }) => [id, selectProducts(products, { category: id }).length]), [["oils", 3], ["wood-oils", 3], ["ghee", 1], ["masala", 4], ["milk", 3], ["paneer", 1], ["rice", 3], ["grain", 2]]);
  assert.equal(productCategories.find(({ id }) => id === "oils").tamilLabel, "செக்கு எண்ணெய்");
  assert.equal(productCategories.find(({ id }) => id === "wood-oils").tamilLabel, "மரச்செக்கு எண்ணெய்");
});

test("Ragi and Bajra use the owner's confirmed kilogram prices and offer 500 g packs", () => {
  for (const product of products.filter(({ category }) => category === "grain")) {
    assert.deepEqual(productPackSizes(product), ["500 g", "1 kg"]);
    assert.equal(quantityLabel(product), "1 kg");
    assert.equal(canAddToBag(product), true);
    assert.equal(getProductVariant(product.id).price, product.price);
  }
  assert.equal(getProductVariant("ragi", "ragi:500g").price, 48);
  assert.equal(getProductVariant("bajra", "bajra:500g").price, 37);
  assert.equal(products.filter(canAddToBag).length, 20);
});

test("search handles names, Tamil names and categories without hiding higher prices", () => {
  assert.deepEqual(selectProducts(products, { query: "  COCONUT  " }).map(({ id }) => id), ["coconut", "wood-coconut"]);
  assert.deepEqual(selectProducts(products, { query: "பால்கோவா" }).map(({ id }) => id), ["palkova"]);
  assert.equal(selectProducts(products, { query: "rice" }).length, 3);
  assert.equal(selectProducts(products, { query: "ghee" })[0].price, 1930);
  assert.equal(selectProducts(products, { query: "no matching product" }).length, 0);
  assert.equal(selectProducts(products, {}).length, 20);
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

test("removed brand and products cannot return; only reviewed image assets are shipped", () => {
  const files = readdirSync(new URL("../src/components/", import.meta.url)).filter((name) => name.endsWith(".tsx"));
  for (const file of files) {
    const source = readFileSync(new URL(`../src/components/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /aishw(?:a|ari)|sunflower|castor|almond|product\.image|originalPrice|images\/hero/i, file);
  }
  const assets = readdirSync(new URL("../public/", import.meta.url), { recursive: true });
  // Brand marks, credited editorial photos and the reviewed illustrative series.
  assert.deepEqual(assets.filter((name) => /\.(jpg|jpeg|png|webp)$/i.test(name)).sort(),
    [
      "apple-touch-icon.png", "brand-icon.png", "images/asal-logo.png", "images/asal-social.png",
      "icons/owner-180.png", "icons/owner-192.png", "icons/owner-512.png", "icons/owner-maskable-512.png",
      ...["oils", "wood-oils", "ghee", "masala", "milk", "paneer", "rice", "grain"].map((id) => `images/categories/${id}.webp`),
      "images/editorial/fields.webp", "images/editorial/kitchen-harvest.webp",
      "images/heritage/nammalvar.webp",
      ...["chekku", "bilona", "cattle"].flatMap((id) => [640, 1200].map((width) => `images/heritage/${id}-${width}.webp`)),
      ...["groundnut", "sesame", "coconut", "turmeric", "curry-masala", "chilli-powder", "coriander-powder", "ragi", "bajra", "bilona-ghee", "bilona-butter", "palkova", "karuppu-kavuni-halwa", "paneer", "karuppu-kavuni", "mapillai-samba", "seera-samba"].flatMap((id) => [240, 800].map((width) => `images/products/${id}-${width}.webp`)),
    ].sort());
});

test("prices use Indian rupee formatting", () => {
  assert.equal(formatPrice(420), "₹420");
  assert.equal(formatPrice(1930), "₹1,930");
});

test("image spaces use the shared illustrative renderer and retain a future fallback", () => {
  for (const file of ["ProductCard", "StorefrontDialogs", "CommerceLayout"]) {
    const source = readFileSync(new URL(`../src/components/${file}.tsx`, import.meta.url), "utf8");
    assert.match(source, /<ProductImage productId=\{product.id\}/, file);
  }
  const placeholder = readFileSync(new URL("../src/components/ProductImagePlaceholder.tsx", import.meta.url), "utf8");
  assert.match(placeholder, /Photo coming soon/);
  assert.doesNotMatch(placeholder, /<img|<Image\s|https?:\/\//);
});

test("every product has a searchable Tamil name and every category has a Tamil label", () => {
  for (const product of products) {
    assert.match(product.tamilName, /[\u0B80-\u0BFF]/);
    assert.ok(selectProducts(products, { query: product.tamilName }).some(({ id }) => id === product.id));
  }
  for (const category of productCategories) {
    assert.match(category.tamilLabel, /[\u0B80-\u0BFF]/);
    const matches = selectProducts(products, { category: category.id, query: category.tamilLabel });
    assert.equal(matches.length, products.filter((product) => product.category === category.id).length);
    assert.ok(matches.every((product) => product.category === category.id));
  }
  assert.equal(new Set(products.map(({ tamilName }) => tamilName)).size, products.length);
});

test("Tamil names remain visible on product cards, search results and cart summaries", () => {
  for (const file of ["ProductCard", "StorefrontDialogs", "CommerceLayout"]) {
    const source = readFileSync(new URL(`../src/components/${file}.tsx`, import.meta.url), "utf8");
    assert.match(source, /lang="ta"[^>]*>\{product\.tamilName\}/, file);
  }
  const decoration = readFileSync(new URL("../src/components/Kolam.tsx", import.meta.url), "utf8");
  assert.match(decoration, /alt="" aria-hidden="true"/);
});

test("category sections preserve filters and sort, omit empty groups and never duplicate products", () => {
  const selected = selectProducts(products, { sort: "price-asc", maxPrice: 600 });
  const groups = groupProducts(selected);
  assert.deepEqual(groups.map(({ id }) => id), ["oils", "wood-oils", "masala", "milk", "rice", "grain"]);
  const flattened = groups.flatMap(({ products: items }) => items);
  assert.equal(new Set(flattened.map(({ id }) => id)).size, selected.length);
  assert.deepEqual(flattened.map(({ id }) => id).sort(), selected.map(({ id }) => id).sort());
  for (const group of groups) {
    assert.ok(group.products.every((product) => product.category === group.id));
    assert.deepEqual(group.products.map(({ price }) => price), group.products.map(({ price }) => price).sort((a, b) => a - b));
  }
  assert.deepEqual(groupProducts([]), []);
  assert.deepEqual(groupProducts(selectProducts(products, { category: "saved", saved: ["sesame", "paneer"] })).map(({ id }) => id), ["oils", "paneer"]);
});

test("pack sizes match the owner's note and confirmed-base products have selectable variants", () => {
  assert.deepEqual(categoryPackSizes, {
    oils: ["500 ml", "1 Litre", "2 Litres", "5 Litres"],
    "wood-oils": ["500 ml", "1 Litre", "2 Litres", "5 Litres"],
    ghee: ["200 ml", "500 ml", "1 Litre"],
    masala: ["100 g", "250 g", "500 g", "1 kg"],
    milk: ["200 g", "500 g", "1 kg"],
    paneer: ["200 g", "500 g", "1 kg"],
    rice: ["500 g", "1 kg"],
    grain: ["500 g", "1 kg"],
  });
  for (const product of products.filter(canAddToBag)) {
    assert.ok(productPackSizes(product).includes(product.size));
    assert.deepEqual(productVariantsFor(product).map(({ size }) => size), productPackSizes(product));
    assert.equal(getProductVariant(product.id).price, product.price);
  }
  const details = readFileSync(new URL("../src/components/StorefrontDialogs.tsx", import.meta.url), "utf8");
  assert.match(details, /Price pending/);
  assert.match(details, /type="radio"/);
  assert.match(details, /rounded up to the next whole rupee/);
  assert.doesNotMatch(details, /price\s*\*\s*(?:size|pack)/);
});

test("pack prices derive once from the base and round UP to whole rupees", () => {
  for (const [productId, variantId, price] of [
    ["groundnut", "groundnut:500ml", 210], ["groundnut", "groundnut:2l", 840],
    ["groundnut", "groundnut:5l", 2100], ["curry-masala", "curry-masala:100g", 48],
    ["curry-masala", "curry-masala:250g", 120], ["curry-masala", "curry-masala:500g", 239],
    ["coriander-powder", "coriander-powder:250g", 103], ["karuppu-kavuni", "karuppu-kavuni:500g", 98],
    ["bilona-ghee", "bilona-ghee:200ml", 386], ["bilona-ghee", "bilona-ghee:500ml", 965],
  ]) assert.equal(getProductVariant(productId, variantId).price, price, variantId);
  assert.equal(new Set(productVariants.map(({ id }) => id)).size, productVariants.length);
  for (const variant of productVariants) {
    const product = products.find(({ id }) => id === variant.productId);
    const amount = Number.parseInt(variant.size) * (/kg|Litre/.test(variant.size) ? 1000 : 1);
    const unrounded = product.price * amount / 1000;
    assert.ok(Number.isSafeInteger(variant.price * 100));
    assert.ok(variant.price >= unrounded && variant.price - unrounded < 1, variant.id);
  }
});

test("wood-pressed oils mirror the corresponding cold-pressed packs without reusing product or variant IDs", () => {
  for (const id of ["groundnut", "sesame", "coconut"]) {
    const cold = products.find((product) => product.id === id);
    const wood = products.find((product) => product.id === `wood-${id}`);
    assert.ok(wood);
    assert.equal(wood.category, "wood-oils");
    assert.equal(wood.price, cold.price);
    assert.equal(wood.size, cold.size);
    assert.match(wood.name, /^Wood-pressed /);
    assert.match(wood.tamilName, /^மரச்செக்கு /);
    assert.deepEqual(
      productVariantsFor(wood).map(({ size, price }) => ({ size, price })),
      productVariantsFor(cold).map(({ size, price }) => ({ size, price })),
    );
    assert.equal(getProductVariant(wood.id, `${id}:1l`), undefined);
    assert.equal(getProductVariant(id, `${wood.id}:1l`), undefined);
  }
  const source = readFileSync(new URL("../src/components/Catalogue.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /Product details are being confirmed|preparation is verified/);
});

test("missing-base and dimension-mismatched packs cannot gain variants", () => {
  assert.deepEqual(productVariantsFor({ ...products[0], size: null }), []);
  assert.deepEqual(productVariantsFor({ ...products[0], size: "1 kg" }), []);
  for (const price of [0, -1, NaN, Infinity, 1.2]) {
    assert.deepEqual(productVariantsFor({ ...products[0], price }), []);
  }
});

test("kolam artwork stays vector-only, transparent and local", () => {
  const decoration = readFileSync(new URL("../src/components/Kolam.tsx", import.meta.url), "utf8");
  for (const asset of ["kolam-sikku.svg", "kolam-border.svg"]) {
    assert.ok(decoration.includes(asset));
    const svg = readFileSync(new URL(`../public/images/${asset}`, import.meta.url), "utf8");
    assert.match(svg, /viewBox=/);
    assert.match(svg, /<path /);
    assert.match(svg, /fill="none"/);
    assert.ok(Buffer.byteLength(svg) < 6000, "Decoration should remain lightweight");
    assert.doesNotMatch(svg, /<image|<rect|<script|<foreignObject|data:|onload|https?:\/\/(?!www\.w3\.org\/2000\/svg)/i);
  }
});

test("ornaments are limited to two major section breaks, never category or checkout borders", () => {
  for (const file of ["Storefront", "Editorial"]) {
    const source = readFileSync(new URL(`../src/components/${file}.tsx`, import.meta.url), "utf8");
    assert.equal((source.match(/<KolamDivider/g) ?? []).length, 1, file);
  }
  for (const file of ["Catalogue", "CommerceLayout"]) {
    const source = readFileSync(new URL(`../src/components/${file}.tsx`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /Kolam/, file);
  }
  const css = readFileSync(new URL("../src/app/heritage.css", import.meta.url), "utf8");
  assert.match(css, /width: min\(344px, calc\(100% - 48px\)\)/);
  assert.doesNotMatch(css, /repeat-x|kolam-.*\.webp|category-divider/);
});
