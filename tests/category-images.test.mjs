import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { categoryImages } from "../src/content/category-images.ts";
import { productCategories, products, selectProducts } from "../src/content/products.ts";

test("every owner-listed category has a unique self-hosted category image", () => {
  assert.deepEqual(Object.keys(categoryImages), productCategories.map(({ id }) => id));
  assert.equal(new Set(Object.values(categoryImages)).size, 8);
  for (const [id, src] of Object.entries(categoryImages)) {
    assert.equal(src, `/images/categories/${id}.webp`);
    const image = readFileSync(new URL(`../public${src}`, import.meta.url));
    assert.equal(image.toString("ascii", 0, 4), "RIFF", id);
    assert.equal(image.toString("ascii", 8, 12), "WEBP", id);
    // The optimized assets use opaque, lossy WebP (VP8) at 800 × 800.
    assert.equal(image.toString("ascii", 12, 16), "VP8 ", id);
    assert.equal(image.readUInt16LE(26) & 0x3fff, 800, id);
    assert.equal(image.readUInt16LE(28) & 0x3fff, 800, id);
    assert.ok(image.byteLength < 100_000, `${id} exceeds the 100 KB budget`);
  }
});

test("homepage category shortcuts retain bilingual navigation, not product imagery", () => {
  const source = readFileSync(new URL("../src/components/Storefront.tsx", import.meta.url), "utf8");
  assert.match(source, /productCategories\.map\(\(\{ id, label, tamilLabel \}\)/);
  assert.match(source, /onClick=\{\(\) => goToCollection\(id\)\}/);
  assert.match(source, /aria-pressed=\{category === id\} aria-controls="collection"/);
  assert.match(source, /src=\{categoryImages\[id\]\} alt="" width="800" height="800" loading="lazy" decoding="async"/);
  assert.match(source, /<strong>\{label\}<\/strong><span lang="ta">\{tamilLabel\}<\/span>/);
  assert.match(source, /Category images are illustrative\./);
  assert.match(source, /setCategory\(next\)/);
  assert.match(source, /getElementById\("collection"\)\?\.scrollIntoView/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(source, /categoryIcons|category-shortcut-icon/);
  const shelf = source.slice(source.indexOf('<section className="category-shelf'), source.indexOf('<div className="qualities'));
  assert.doesNotMatch(shelf, /<ArrowUpRight/);
  assert.match(shelf, /className="category-scroll-hint"[\s\S]*Scroll to browse/);
  assert.equal(selectProducts(products, { category: "wood-oils" }).length, 3);
});

test("category shortcuts stay in one compact row with bounded square thumbnails", () => {
  const css = readFileSync(new URL("../src/app/heritage.css", import.meta.url), "utf8");
  assert.match(css, /\.category-shortcuts \{[^}]*grid-template-columns: repeat\(8, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.category-shortcut-photo \{[^}]*width: 6rem;[^}]*aspect-ratio: 1/);
  assert.match(css, /\.category-shortcut \{[^}]*align-items: center;[^}]*border: 0;[^}]*background: transparent;[^}]*text-align: center/);
  assert.doesNotMatch(css, /\.category-shortcuts \{[^}]*repeat\([24],/);
});

test("narrow category strips scroll without shrinking labels and retain accessible states", () => {
  const css = readFileSync(new URL("../src/app/heritage.css", import.meta.url), "utf8");
  assert.match(css, /\.category-shortcuts \{[^}]*overflow-x: auto;[^}]*scroll-snap-type: x proximity/);
  assert.match(css, /@media \(max-width: 1100px\)[\s\S]*\.category-shortcuts \{[^}]*grid-template-columns: none;[^}]*grid-auto-flow: column;[^}]*grid-auto-columns: 7rem/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*\.category-shortcuts \{[^}]*grid-auto-columns: 6rem/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*\.category-shortcut-photo \{[^}]*width: 5rem/);
  assert.match(css, /\.category-shortcut:focus-visible \{[^}]*outline: 3px solid var\(--green\)/);
  assert.match(css, /\.category-shortcut\[aria-pressed="true"\] \.category-shortcut-photo \{[^}]*border-color: var\(--green\)/);
  assert.match(css, /\.category-shortcut-caption \{[^}]*overflow-wrap: anywhere/);
  assert.doesNotMatch(css, /category-shortcut-icon/);
});
