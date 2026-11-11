import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import robots from "../src/app/robots.ts";
import sitemap from "../src/app/sitemap.ts";
import { products } from "../src/content/products.ts";
import { productPath } from "../src/lib/product-pages.ts";
import {
  homeDescription, homeTitle, publicPageMetadata, serializeJsonLd, siteName,
  siteUrl, websiteStructuredData, woodOilsBreadcrumbs, woodOilsDescription, woodOilsPath,
} from "../src/lib/seo.ts";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("public metadata uses the production HTTPS brand and route-specific canonicals", () => {
  const home = publicPageMetadata(homeTitle, homeDescription, "/");
  const oils = publicPageMetadata(`Wood-pressed Oils | ${siteName}`, woodOilsDescription, woodOilsPath);
  assert.equal(siteUrl, "https://asaliyarkaiangadi.in");
  assert.equal(home.title.absolute, "Asal Iyarkai Angadi | Oils & Traditional Foods");
  assert.match(home.description, /Asaliyarkaiangadi/);
  assert.equal(home.alternates.canonical, `${siteUrl}/`);
  assert.equal(oils.alternates.canonical, `${siteUrl}${woodOilsPath}`);
  assert.notEqual(home.title.absolute, oils.title.absolute);
  assert.notEqual(home.description, oils.description);
  for (const metadata of [home, oils]) {
    assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
    assert.equal(metadata.openGraph.siteName, siteName);
    assert.equal(metadata.twitter.card, "summary_large_image");
    assert.equal(metadata.twitter.title, metadata.title.absolute);
    for (const image of metadata.openGraph.images) {
      assert.equal(image.width, 1200);
      assert.equal(image.height, 630);
      assert.ok(readFileSync(new URL(`../public${new URL(image.url).pathname}`, import.meta.url)).length > 0);
    }
  }
});

test("root is indexable but cart, checkout and API responses are excluded", () => {
  const layout = source("src/app/layout.tsx");
  assert.match(layout, /robots: \{ index: true, follow: true/);
  assert.doesNotMatch(layout, /index: false|noindex/);
  assert.match(layout, /GOOGLE_SITE_VERIFICATION/);
  // No inherited home canonical on private or nonexistent URLs.
  assert.doesNotMatch(layout, /alternates:|canonical:/);
  for (const route of ["cart", "checkout"]) {
    assert.match(source(`src/app/${route}/page.tsx`), /robots: \{ index: false, follow: true \}/);
  }
  assert.match(source("next.config.ts"), /key: "X-Robots-Tag", value: "noindex, nofollow"/);
});

test("robots allows HTML and assets, including noindex pages, and advertises the sitemap", () => {
  const policy = robots();
  assert.equal(policy.rules.userAgent, "*");
  assert.equal(policy.rules.allow, "/");
  assert.equal(policy.rules.disallow, "/api/");
  assert.equal(policy.sitemap, `${siteUrl}/sitemap.xml`);
});

test("sitemap lists only distinct canonical public pages without fabricated timestamps", () => {
  assert.deepEqual(sitemap(), [
    { url: `${siteUrl}/` }, { url: `${siteUrl}${woodOilsPath}` },
    ...products.map((product) => ({ url: `${siteUrl}${productPath(product)}` })),
  ]);
  for (const entry of sitemap()) {
    assert.equal(entry.lastModified, undefined);
    assert.doesNotMatch(entry.url, /\/(?:cart|checkout|api)(?:\/|$)|localhost|workers\.dev|[#?]/);
  }
});

test("brand structured data links the website to its organization without invented sales claims", () => {
  const [organization, website] = websiteStructuredData["@graph"];
  assert.equal(organization["@type"], "Organization");
  assert.equal(website["@type"], "WebSite");
  assert.equal(website.name, siteName);
  assert.ok(website.alternateName.includes("Asaliyarkaiangadi"));
  assert.ok(website.alternateName.includes("அசல் இயற்கை அங்காடி"));
  assert.equal(website.publisher["@id"], organization["@id"]);
  assert.equal(website.url, `${siteUrl}/`);
  assert.doesNotMatch(JSON.stringify(websiteStructuredData), /aggregateRating|review|offers|InStock|address|telephone|SearchAction/);
  assert.equal(woodOilsBreadcrumbs.itemListElement[1].item, `${siteUrl}${woodOilsPath}`);
  assert.ok(readFileSync(new URL(`../public${new URL(organization.logo.url).pathname}`, import.meta.url)).length > 0);
  for (const page of ["src/app/page.tsx", "src/app/collections/wood-pressed-oils/page.tsx"]) {
    assert.match(source(page), /type="application\/ld\+json"/);
    assert.match(source(page), /serializeJsonLd\(/);
  }
});

test("JSON-LD escapes script-breaking characters without changing the data", () => {
  const data = { name: "</script><script>alert(1)</script>" };
  const serialized = serializeJsonLd(data);
  assert.doesNotMatch(serialized, /</);
  assert.deepEqual(JSON.parse(serialized), data);
});

test("the collection is distinct at initial render and linked with a crawlable anchor", () => {
  assert.match(source("src/app/collections/wood-pressed-oils/page.tsx"), /<Storefront initialCategory="wood-oils" \/>/);
  const storefront = source("src/components/Storefront.tsx");
  assert.match(storefront, /useState<Category>\(initialCategory\)/);
  assert.match(storefront, /href=\{woodOilsPath\}/);
  assert.match(storefront, /<h1 id="hero-title">\{isWoodOilsPage \? "Wood-pressed" : "Asal Iyarkai"\}/);
  assert.match(storefront, /<em>\{isWoodOilsPage \? "oils" : "Angadi"\}<\/em>/);
  assert.match(homeDescription, /Asaliyarkaiangadi/);
  assert.match(storefront, /Store preview/);
});

test("www is routed through the Worker and canonical redirects preserve paths", () => {
  const worker = JSON.parse(source("wrangler.jsonc"));
  assert.ok(worker.routes.some((route) => route.pattern === "www.asaliyarkaiangadi.in/*" && route.zone_name === "asaliyarkaiangadi.in"));
  const config = source("next.config.ts");
  assert.match(config, /type: "host", value: "www\.asaliyarkaiangadi\.in"/);
  assert.match(config, /key: "x-forwarded-proto", value: "http"/);
  assert.match(config, /destination: "https:\/\/asaliyarkaiangadi\.in\/:path\*"/);
});

test("favicons and brand preview files are real PNGs with the expected dimensions", () => {
  for (const [path, width, height] of [
    ["brand-icon.png", 96, 96],
    ["apple-touch-icon.png", 180, 180],
    ["images/asal-logo.png", 600, 240],
    ["images/asal-social.png", 1200, 630],
  ]) {
    const data = readFileSync(new URL(`../public/${path}`, import.meta.url));
    assert.equal(data.subarray(1, 4).toString(), "PNG");
    assert.equal(data.readUInt32BE(16), width);
    assert.equal(data.readUInt32BE(20), height);
  }
});
