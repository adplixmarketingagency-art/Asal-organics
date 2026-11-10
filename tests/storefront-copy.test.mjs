import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { productCategories } from "../src/content/products.ts";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("category headings show names and pack sizes without repetitive descriptions", () => {
  assert.equal(productCategories.length, 7);
  for (const category of productCategories) {
    assert.ok(category.label && category.tamilLabel);
    assert.equal("description" in category, false, category.id);
  }
  const catalogue = source("src/components/Catalogue.tsx");
  assert.doesNotMatch(catalogue, /category-description|group\.description|to discover/);
  assert.match(catalogue, /<h2 id="collection-title">Shop by category<\/h2>/);
  assert.match(catalogue, /Pack sizes: \{categoryPackSizes\[group.id\]/);
  assert.match(catalogue, /Real payments and delivery orders are not yet available/);
});

test("storefront keeps its identity and navigation without slogan blocks", () => {
  const storefront = source("src/components/Storefront.tsx");
  assert.doesNotMatch(storefront, /announcement-bar|hero-description|hero-footnote|className="qualities|FROM OUR PANTRY|Rooted in tradition|Find your everyday|Nature, uncomplicated|Back to what’s real|Good food\.|Simple rituals|fresh beginning|Thoughtfully designed/);
  assert.match(storefront, /id="hero-title"/);
  assert.match(storefront, /Asal Iyarkai/);
  assert.match(storefront, /அசல் இயற்கை அங்காடி/);
  assert.match(storefront, /Ordering & delivery/);
  assert.match(storefront, /href="\/credits">Image credits/);
  assert.match(storefront, /Store preview/);
});

test("editorial copy stays factual and keeps pricing and ordering guidance", () => {
  const editorial = source("src/components/Editorial.tsx");
  assert.doesNotMatch(editorial, /Rooted in the land|Remembered at the table|A LITTLE CLARITY|Simple answers|closing-note|What can I find in the collection/);
  assert.match(editorial, /id="nammalvar-title">G. Nammalvar/);
  assert.match(editorial, /natural-farming advocate/);
  assert.match(editorial, /not an endorsement or affiliation/);
  assert.match(editorial, /rounded up to a whole rupee/);
  assert.match(editorial, /Real payments and delivery orders are not yet available/);
});

test("shopping dialogs and checkout use functional headings instead of filler", () => {
  const dialogs = source("src/components/StorefrontDialogs.tsx");
  assert.doesNotMatch(dialogs, /A LITTLE DISCOVERY|A place for every essential|A little goodness|A simpler kind|BACK TO WHAT|YOUR EVERYDAY ESSENTIALS/);
  assert.match(dialogs, /<h2>Search products<\/h2>/);
  assert.match(dialogs, /<h2>Shop by category<\/h2>/);
  assert.match(dialogs, /Real payments and delivery orders are not yet available/);
  const commerce = source("src/components/CommerceLayout.tsx");
  assert.doesNotMatch(commerce, /announcement-bar|goodness|uncomplicated|everyday essentials|summary-footnote/);
  assert.match(commerce, /<h1>Your bag is empty<\/h1>/);
  assert.match(commerce, /<h2>Order summary<\/h2>/);
  assert.match(commerce, /Delivery and tax rules must be confirmed/);
  const cart = source("src/components/CartPage.tsx");
  assert.match(cart, /<h1>Your bag<\/h1>/);
  assert.doesNotMatch(cart, /goodness|A few good things/);
  const checkout = source("src/components/CheckoutPage.tsx");
  assert.doesNotMatch(checkout, /One last|A little closer|everyday essentials|Where’s home|Details, checked/);
  assert.match(checkout, /Review your order/);
  assert.match(checkout, /Contact &amp; delivery/);
  const product = source("src/app/products/[id]/page.tsx");
  assert.doesNotMatch(product, /product-page-intro/);
  assert.match(product, /Real payments and delivery orders are not yet available/);
});
