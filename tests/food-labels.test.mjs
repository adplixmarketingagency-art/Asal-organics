import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { foodLabelReview } from "../src/content/food-labels.ts";
import { products } from "../src/content/products.ts";
import { productImages } from "../src/content/product-images.ts";
import { productDescription, productBreadcrumbs } from "../src/lib/product-pages.ts";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("food names identify the powder, flour and rice already described in Tamil", () => {
  for (const [id, english, tamil] of [
    ["turmeric", "Turmeric Powder", "தூள்"],
    ["ragi", "Ragi Flour", "மாவு"],
    ["bajra", "Bajra Flour", "மாவு"],
    ["karuppu-kavuni", "Karuppu Kavuni Rice", "அரிசி"],
    ["mapillai-samba", "Mapillai Samba Rice", "அரிசி"],
    ["seera-samba", "Seera Samba Rice (Vasanai)", "அரிசி"],
  ]) {
    const product = products.find((item) => item.id === id);
    assert.equal(product.name, english);
    assert.ok(product.tamilName.includes(tamil));
    assert.ok(productDescription(product).includes(english));
    assert.equal(productBreadcrumbs(product).itemListElement.at(-1).name, english);
  }
});

test("pending declarations are visible on both product detail entry points", () => {
  assert.equal(foodLabelReview.readyForSale, false);
  assert.match(foodLabelReview.notice, /awaiting verification.*ordering remains unavailable/);
  for (const required of ["Ingredients", "allergens", "nutrition", "vegetarian/non-vegetarian", "FSSAI", "consumer-care", "storage", "where applicable"]) {
    assert.ok(foodLabelReview.pendingDetails.includes(required), required);
  }
  assert.match(foodLabelReview.pendingDetails, /No allergen-free status is claimed/);
  assert.match(foodLabelReview.imageNotice, /Packaging claims remain under review/);
  assert.match(foodLabelReview.brandNotice, /certification has not been verified/);
  assert.match(source("src/components/ProductLabelNotice.tsx"), /<details>[\s\S]*<summary>What is pending\?/);
  for (const file of ["src/app/products/[id]/page.tsx", "src/components/StorefrontDialogs.tsx"]) {
    assert.match(source(file), /<ProductLabelNotice \/>/);
  }
  assert.match(source("src/components/Editorial.tsx"), /foodLabelReview.brandNotice/);
  assert.doesNotMatch(source("src/components/BrandWordmark.tsx"), /®|brand-registration/);
});

test("existing bottle images remain available while the owner prepares replacements", () => {
  const publicAssets = readdirSync(new URL("../public/", import.meta.url), { recursive: true });
  assert.equal(publicAssets.filter((path) => /bottle.*\.webp$/.test(path)).length, 14);
  for (const id of ["groundnut", "sesame", "coconut", "wood-groundnut", "wood-sesame", "wood-coconut"]) {
    assert.equal(productImages[id].kind, "packaging");
  }
  for (const asset of ["groundnut-bottle", "groundnut-bottle-v2", "gingelly-bottle", "coconut-bottle", "wood-groundnut-bottle", "wood-gingelly-bottle", "wood-coconut-bottle"]) {
    for (const size of [240, 800]) {
      const bytes = readFileSync(new URL(`../public/images/products/${asset}-${size}.webp`, import.meta.url));
      assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
    }
  }
  assert.match(source("src/lib/payment-config.ts"), /foodLabelReview.readyForSale && catalogueApproved/);
});
