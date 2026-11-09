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

test("heritage images are scattered in relevant categories, not a separate gallery", () => {
  const catalogue = source("src/components/Catalogue.tsx");
  const illustration = source("src/components/HeritageIllustration.tsx");
  assert.match(catalogue, /group.id === "wood-oils" && <HeritageIllustration subject="chekku"/);
  assert.match(catalogue, /group.id === "ghee" && <HeritageIllustration subject="bilona"/);
  assert.match(catalogue, /group.id === "milk" && <HeritageIllustration subject="cattle"/);
  assert.match(illustration, /AI-generated heritage artwork/);
  assert.match(illustration, /<figcaption>\{label\}<\/figcaption>/);
  assert.doesNotMatch(illustration, /<span>AI illustration/);
  assert.match(illustration, /loading="lazy"/);
  assert.match(illustration, /width="2528" height="1696"/);
  assert.doesNotMatch(source("src/components/Editorial.tsx"), /heritage-gallery|heritage-studies|traditions\.map/);
  const css = source("src/app/imagery.css");
  assert.doesNotMatch(css, /\.heritage-gallery|\.heritage-studies/);
  assert.match(css, /\.catalogue-art-bilona \{ grid-column: auto/);
  assert.match(css, /\.list-view \.catalogue-art/);
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
