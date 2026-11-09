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

test("shared image rendering discloses illustrative status and controls loading", () => {
  const component = source("src/components/ProductImage.tsx");
  assert.match(component, /Illustrative image:/);
  assert.match(component, /Not an actual product photograph/);
  assert.match(component, /product-artwork-caption">Illustrative image/);
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
  assert.match(source("src/components/Catalogue.tsx"), /AI-generated illustrations/);
});

test("heritage images are scattered in relevant categories, not a separate gallery", () => {
  const catalogue = source("src/components/Catalogue.tsx");
  const illustration = source("src/components/HeritageIllustration.tsx");
  assert.match(catalogue, /group.id === "wood-oils" && <HeritageIllustration subject="chekku"/);
  assert.match(catalogue, /group.id === "ghee" && <HeritageIllustration subject="bilona"/);
  assert.match(catalogue, /group.id === "milk" && <HeritageIllustration subject="cattle"/);
  assert.match(catalogue, /not Asal’s farms, cattle or production methods/);
  assert.match(illustration, /AI-generated heritage artwork/);
  assert.match(illustration, /AI illustration/);
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
  assert.match(editorial, /Voiceoftamil \/ Wikimedia Commons/);
  assert.match(editorial, /creativecommons.org\/licenses\/by-sa\/3.0/);
  assert.match(editorial, /Converted to WebP; uncropped/);
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
