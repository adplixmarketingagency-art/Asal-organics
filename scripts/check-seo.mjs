import assert from "node:assert/strict";
import { products, productVariantsFor } from "../src/content/products.ts";
import { productPath } from "../src/lib/product-pages.ts";
import { siteName, siteUrl, woodOilsPath } from "../src/lib/seo.ts";

// Run against a local production build or the deployed Worker. This checks
// indexability, not Google's index or rankings; those require separate evidence.
const base = new URL(process.argv[2] ?? siteUrl).origin;
const publicPaths = ["/", woodOilsPath, ...products.map(productPath)];
const titles = new Set();
const descriptions = new Set();
const htmlByPath = new Map();
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "g"))].map((match) => match[0]);

async function get(path, options = {}) {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(30000), ...options });
  return { response, html: await response.text() };
}

for (const path of publicPaths) {
  const { response, html } = await get(path, { redirect: "manual" });
  assert.equal(response.status, 200, path);
  assert.doesNotMatch(response.headers.get("x-robots-tag") ?? "", /noindex/i, path);
  const robots = tags(html, "meta").filter((tag) => ["robots", "googlebot"].includes(attribute(tag, "name")));
  assert.ok(robots.length, `${path}: robots metadata`);
  assert.ok(robots.every((tag) => !/noindex|none/i.test(attribute(tag, "content"))), path);
  const canonicals = tags(html, "link").filter((tag) => attribute(tag, "rel") === "canonical");
  assert.equal(canonicals.length, 1, `${path}: one canonical`);
  assert.equal(new URL(attribute(canonicals[0], "href")).href, `${siteUrl}${path}`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = tags(html, "meta").find((tag) => attribute(tag, "name") === "description");
  assert.ok(title?.includes(siteName), path);
  assert.ok(attribute(description ?? "", "content"), path);
  assert.ok(!titles.has(title), `${path}: unique title`);
  assert.ok(!descriptions.has(description), `${path}: unique description`);
  titles.add(title);
  descriptions.add(description);
  assert.equal(tags(html, "h1").length, 1, `${path}: one server-rendered H1`);
  const schema = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  assert.ok(schema.length, `${path}: server-rendered JSON-LD`);
  assert.doesNotMatch(JSON.stringify(schema), /aggregateRating|"offers"|"InStock"/);
  const product = products.find((item) => productPath(item) === path);
  if (product) {
    assert.ok(html.includes(product.tamilName), `${path}: Tamil name`);
    assert.match(html, /<table\b/);
    for (const variant of productVariantsFor(product)) assert.ok(html.includes(variant.size), `${path}: ${variant.size}`);
    if (!product.size) assert.ok(html.includes("Price pending"), path);
    assert.ok(html.includes("Real payments and delivery orders are not yet available"), path);
  }
  htmlByPath.set(path, html);
  console.log(`PASS ${path}: HTTP, metadata, H1, structured data and SSR content`);
}

const { response: sitemapResponse, html: sitemap } = await get("/sitemap.xml");
assert.equal(sitemapResponse.status, 200);
assert.match(sitemapResponse.headers.get("content-type") ?? "", /xml/);
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.deepEqual(sitemapUrls.sort(), publicPaths.map((path) => `${siteUrl}${path}`).sort());
const { response: robotsResponse, html: robots } = await get("/robots.txt");
assert.equal(robotsResponse.status, 200);
assert.match(robots, /Allow: \//);
assert.doesNotMatch(robots, /^Disallow:\s*\/\s*$/m);
assert.ok(robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`));
for (const product of products) {
  assert.ok(htmlByPath.get("/").includes(`href="${productPath(product)}"`), `Crawlable home link: ${product.id}`);
}

for (const path of ["/cart", "/checkout", "/products/not-a-real-product", "/not-a-real-page"]) {
  const { response, html } = await get(path);
  assert.equal(response.status, path.includes("not-a-real") ? 404 : 200, path);
  assert.ok(tags(html, "meta").some((tag) => attribute(tag, "name") === "robots" && /noindex/.test(attribute(tag, "content"))), path);
}
// A Googlebot user agent should see the same indexable content, not a challenge.
const { response, html } = await get("/", { headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" } });
assert.equal(response.status, 200);
assert.ok(html.includes("Asaliyarkaiangadi"));
assert.ok(html.includes(`href="${productPath(products[0])}"`));
assert.ok(tags(html, "meta").some((tag) => attribute(tag, "name") === "robots" && !/noindex/.test(attribute(tag, "content"))));
console.log(`PASS sitemap (${publicPaths.length} URLs), robots, internal links, private/404 exclusions and Googlebot-UA smoke check`);
console.log("Indexability checks passed. This does NOT confirm Google indexing or first-page ranking.");
