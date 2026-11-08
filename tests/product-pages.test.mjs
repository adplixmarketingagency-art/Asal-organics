import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { products, productVariantsFor } from "../src/content/products.ts";
import { productBreadcrumbs, productDescription, productPath } from "../src/lib/product-pages.ts";
import { publicPageMetadata, siteName, siteUrl, woodOilsPath } from "../src/lib/seo.ts";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("each catalogue product has a unique stable URL and accurate description", () => {
  assert.equal(new Set(products.map(productPath)).size, products.length);
  assert.equal(new Set(products.map(productDescription)).size, products.length);
  for (const product of products) {
    assert.match(productPath(product), /^\/products\/[a-z0-9-]+$/);
    const description = productDescription(product);
    assert.ok(description.includes(product.name));
    assert.ok(description.includes(siteName));
    assert.match(description, /Store preview/);
    assert.doesNotMatch(description, /InStock|free shipping|certified|buy now/i);
    if (!productVariantsFor(product).length) assert.match(description, /prices awaiting confirmation/);
    const metadata = publicPageMetadata(`${product.name} | ${siteName}`, description, productPath(product));
    assert.equal(metadata.alternates.canonical, `${siteUrl}${productPath(product)}`);
  }
});

test("product breadcrumbs match canonical URLs and only include real collection pages", () => {
  for (const product of products) {
    const breadcrumbs = productBreadcrumbs(product);
    assert.equal(breadcrumbs["@type"], "BreadcrumbList");
    const items = breadcrumbs.itemListElement;
    assert.equal(items[0].item, `${siteUrl}/`);
    assert.equal(items.at(-1).item, `${siteUrl}${productPath(product)}`);
    assert.equal(items.at(-1).name, product.name);
    assert.deepEqual(items.map((item) => item.position), items.map((_, i) => i + 1));
    assert.equal(items.length, product.category === "wood-oils" ? 3 : 2);
    if (product.category === "wood-oils") assert.equal(items[1].item, `${siteUrl}${woodOilsPath}`);
    assert.doesNotMatch(JSON.stringify(breadcrumbs), /offers|aggregateRating|InStock/);
  }
});

test("product pages prerender catalogue data and reject unknown product IDs", () => {
  const page = source("src/app/products/[id]/page.tsx");
  assert.match(page, /export const dynamicParams = false/);
  assert.match(page, /generateStaticParams/);
  assert.match(page, /products\.map/);
  assert.match(page, /await params/);
  assert.match(page, /if \(!product\) notFound\(\)/);
  assert.match(page, /generateMetadata/);
  assert.match(page, /<h1 id="product-heading">\{product.name\}<\/h1>/);
  assert.match(page, /lang="ta">\{product.tamilName\}/);
  assert.match(page, /<table/);
  assert.match(page, /variants\.map/);
  assert.match(page, /Real payments and delivery orders are not yet available/);
  assert.match(page, /serializeJsonLd\(productBreadcrumbs\(product\)\)/);
  assert.doesNotMatch(page, /"use client"|Offer|InStock|aggregateRating/);
});

test("product purchase preserves variant IDs and blocks unconfirmed packs", () => {
  const purchase = source("src/components/ProductPurchase.tsx");
  assert.match(purchase, /getProductVariant\(product.id/);
  assert.match(purchase, /disabled=\{!ready \|\| !variant\}/);
  assert.match(purchase, /addItem\(product.id, variant\?\.id\)/);
  assert.match(purchase, /Price pending/);
  assert.match(purchase, /<noscript>/);
});
