import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { products } from "../src/content/products.ts";
import { productImages } from "../src/content/product-images.ts";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("all 20 product IDs have appropriate self-hosted ingredient images", () => {
  assert.deepEqual(Object.keys(productImages).sort(), products.map(({ id }) => id).sort());
  assert.equal(new Set(Object.values(productImages).map(({ asset }) => asset)).size, 17);
  for (const { id } of products) {
    const { asset, alt } = productImages[id];
    assert.ok(alt.length > 20);
    for (const size of [240, 800]) {
      const bytes = readFileSync(new URL(`../public/images/products/${asset}-${size}.webp`, import.meta.url));
      assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
      assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
      assert.equal(bytes.readUInt16LE(26) & 0x3fff, size);
      assert.equal(bytes.readUInt16LE(28) & 0x3fff, size);
      assert.ok(bytes.byteLength < (size === 240 ? 20_000 : 100_000), `${asset} exceeds budget`);
    }
  }
  assert.equal(productImages.groundnut.asset, productImages["wood-groundnut"].asset);
  assert.notEqual(productImages.palkova.asset, productImages["bilona-butter"].asset);
  assert.notEqual(productImages["karuppu-kavuni"].asset, productImages["karuppu-kavuni-halwa"].asset);
});

test("shared image rendering preserves descriptive alt text and controls loading without visible labels", () => {
  const component = source("src/components/ProductImage.tsx");
  assert.match(component, /Illustrative image:/);
  assert.match(component, /Not an actual product photograph/);
  assert.doesNotMatch(component, /product-artwork-caption/);
  assert.match(component, /srcSet=/);
  assert.match(component, /width="800" height="800"/);
  assert.match(component, /priority \? "eager" : "lazy"/);
  assert.match(component, /if \(!image\) return <ProductImagePlaceholder/);
  for (const file of ["ProductCard", "StorefrontDialogs", "CommerceLayout"]) {
    assert.match(source(`src/components/${file}.tsx`), /<ProductImage productId=\{product.id\}/);
  }
  const page = source("src/app/products/[id]/page.tsx");
  assert.match(page, /<ProductImage productId=\{product.id\}[^>]*priority/);
  assert.doesNotMatch(page, /"use client"/);
});

test("visible AI-image labels are absent across all shopping surfaces", () => {
  for (const path of [
    "src/components/Storefront.tsx",
    "src/components/Catalogue.tsx",
    "src/components/StorefrontDialogs.tsx",
    "src/components/CommerceLayout.tsx",
    "src/app/products/[id]/page.tsx",
  ]) {
    assert.doesNotMatch(source(path), /image-disclosure|category-image-note|AI-generated|AI illustration|images are illustrative|not actual product photographs/, path);
  }
  const css = source("src/app/imagery.css");
  assert.doesNotMatch(css, /product-artwork-caption|image-disclosure|catalogue-art figcaption span/);
  // The owner's visual cleanup must not remove buying guidance.
  const catalogue = source("src/components/Catalogue.tsx");
  assert.doesNotMatch(catalogue, /Ragi and Bajra prices are pending/);
  assert.match(catalogue, /Real payments and delivery orders are not yet available/);
});

test("heritage images are decorative section backgrounds, never gallery or product-grid items", () => {
  const catalogue = source("src/components/Catalogue.tsx");
  const illustration = source("src/components/HeritageIllustration.tsx");
  assert.match(catalogue, /group.id === "wood-oils" && <HeritageIllustration subject="chekku"/);
  assert.match(catalogue, /group.id === "ghee" && <HeritageIllustration subject="bilona"/);
  assert.match(catalogue, /group.id === "milk" && <HeritageIllustration subject="cattle"/);
  assert.match(illustration, /className=\{`category-backdrop category-backdrop-\$\{subject\}`\} aria-hidden="true"/);
  assert.match(illustration, /alt=""/);
  assert.doesNotMatch(illustration, /figcaption|<figure|AI illustration|label:/);
  assert.match(illustration, /loading="lazy"/);
  assert.match(illustration, /width="2528" height="1696"/);
  const section = catalogue.slice(catalogue.indexOf('className={`category-section category-section-'));
  const headingStart = section.indexOf('className="category-section-heading"');
  assert.equal((section.slice(0, headingStart).match(/<HeritageIllustration/g) || []).length, 3);
  assert.doesNotMatch(section.slice(headingStart), /<HeritageIllustration/);
  assert.doesNotMatch(source("src/components/Editorial.tsx"), /heritage-gallery|heritage-studies|traditions\.map/);
  const css = source("src/app/imagery.css");
  assert.doesNotMatch(css, /\.heritage-gallery|\.heritage-studies|\.catalogue-art/);
  assert.match(css, /\.category-section \{[^}]*isolation: isolate/);
  assert.match(css, /\.category-backdrop \{[^}]*position: absolute;[^}]*z-index: -1;[^}]*pointer-events: none/);
  assert.match(css, /\.category-backdrop > img \{[^}]*filter: blur\(3px\)/);
  assert.doesNotMatch(css, /\.(?:category-section|product-grid|category-section-heading) \{[^}]*filter:/);
});

test("the supplied green field replaces the sunset and Nammalvar appears before shopping sections", () => {
  const storefront = source("src/components/Storefront.tsx");
  assert.match(storefront, /src="\/images\/editorial\/paddy-field.webp"[^>]*width="1024" height="683" fetchPriority="high"/);
  assert.doesNotMatch(storefront, /fields.webp|Golden fields|Landscape inspiration|hero-landscape/);
  assert.match(storefront, /className="hero-backdrop" aria-hidden="true"><img[^>]*alt=""/);
  const css = source("src/app/heritage.css");
  assert.match(css, /\.hero \{[^}]*position: relative;[^}]*isolation: isolate/);
  assert.match(css, /\.hero-backdrop \{[^}]*position: absolute; inset: 0/);
  assert.match(css, /\.hero-backdrop > img \{[^}]*filter: blur\(3px\)/);
  assert.doesNotMatch(css, /\.(?:hero|hero-copy) \{[^}]*filter:/);
  const hero = storefront.indexOf('className="hero"');
  const story = storefront.indexOf("<NammalvarStory ");
  const shelf = storefront.indexOf('className="category-shelf ');
  const catalogue = storefront.indexOf("<Catalogue ");
  const editorial = storefront.indexOf("<Editorial ");
  assert.ok(hero >= 0 && hero < story && story < shelf && shelf < catalogue && catalogue < editorial);
  assert.equal((storefront.match(/<NammalvarStory /g) || []).length, 1);
  const sections = source("src/components/Editorial.tsx");
  assert.match(sections, /export function NammalvarStory/);
  assert.doesNotMatch(sections.slice(sections.indexOf("export function Editorial")), /story-band|id="our-way"/);
  const bytes = readFileSync(new URL("../public/images/editorial/paddy-field.webp", import.meta.url));
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  assert.equal(bytes.readUInt16LE(26) & 0x3fff, 1024);
  assert.equal(bytes.readUInt16LE(28) & 0x3fff, 683);
  assert.ok(bytes.byteLength < 150_000);
  assert.match(source("src/app/credits/page.tsx"), /supplied by the site owner/);
});

test("heritage assets preserve full subjects and credit the real photograph", () => {
  const editorial = source("src/components/Editorial.tsx");
  const credits = source("src/app/credits/page.tsx");
  assert.doesNotMatch(editorial, /Photo:|Voiceoftamil|CC BY-SA|Converted to WebP/);
  assert.match(credits, /Voiceoftamil \/ Wikimedia Commons/);
  assert.match(credits, /creativecommons.org\/licenses\/by-sa\/3.0/);
  assert.match(credits, /Converted to WebP; uncropped/);
  assert.match(source("src/components/Storefront.tsx"), /href="\/credits">Image credits<\/a>/);
  assert.match(editorial, /not an endorsement or affiliation/);
  for (const asset of ["chekku", "bilona", "cattle"]) {
    for (const width of [640, 1200]) {
      const bytes = readFileSync(new URL(`../public/images/heritage/${asset}-${width}.webp`, import.meta.url));
      assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
      assert.ok(bytes.byteLength < 250_000);
    }
  }
  assert.ok(readFileSync(new URL("../public/images/heritage/nammalvar.webp", import.meta.url)).length > 0);
  const css = source("src/app/imagery.css");
  assert.match(css, /object-fit: contain/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
