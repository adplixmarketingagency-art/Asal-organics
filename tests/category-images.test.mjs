import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { categoryImages } from "../src/content/category-images.ts";
import { productCategories, products, selectProducts } from "../src/content/products.ts";

test("every owner-listed category has a unique self-hosted category image", () => {
  assert.deepEqual(Object.keys(categoryImages), productCategories.map(({ id }) => id));
  assert.equal(new Set(Object.values(categoryImages)).size, 7);
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

test("the shared category picker retains bilingual navigation, not product imagery", () => {
  const source = readFileSync(new URL("../src/components/CategorySelector.tsx", import.meta.url), "utf8");
  assert.match(source, /productCategories\.map\(\(\{ id, label, tamilLabel \}\)/);
  assert.match(source, /onClick=\{\(\) => onCategory\(id\)\}/);
  assert.match(source, /aria-pressed=\{category === id\} aria-controls="collection"/);
  assert.match(source, /src=\{categoryImages\[id\]\} alt="" width="800" height="800" loading="lazy" decoding="async"/);
  assert.match(source, /<strong>\{label\}<\/strong><span lang="ta">\{tamilLabel\}<\/span>/);
  assert.doesNotMatch(source, /Category images are illustrative\.|category-image-note/);
  assert.doesNotMatch(source, /categoryIcons|category-shortcut-icon/);
  assert.doesNotMatch(source, /<ArrowUpRight/);
  assert.match(source, /className="category-scroll-hint"[\s\S]*Scroll to browse/);
  assert.match(source, /strip\.scrollLeft \+= button\.left - bounds\.left - 4/);
  assert.doesNotMatch(source, /scrollIntoView/);
  assert.equal(selectProducts(products, { category: "wood-oils" }).length, 3);
});

test("the image picker replaces the duplicate text list and modal product results", () => {
  const catalogue = readFileSync(new URL("../src/components/Catalogue.tsx", import.meta.url), "utf8");
  const storefront = readFileSync(new URL("../src/components/Storefront.tsx", import.meta.url), "utf8");
  const dialogs = readFileSync(new URL("../src/components/StorefrontDialogs.tsx", import.meta.url), "utf8");
  assert.match(catalogue, /<h2 id="collection-title">Shop by category<\/h2>/);
  assert.match(catalogue, /<CategorySelector category=\{category\} onCategory=\{onCategory\} \/>/);
  assert.doesNotMatch(catalogue, /\.\.\.productCategories|Browse by category|onGuide/);
  assert.doesNotMatch(storefront, /category-shelf|category-shortcuts/);
  const guide = dialogs.slice(dialogs.indexOf("function CatalogueGuide"), dialogs.indexOf("function SearchContent"));
  assert.match(guide, /<CategorySelector category=\{category\} onCategory=\{onCategory\} dialog \/>/);
  assert.doesNotMatch(guide, /useState|ProductResults|onExplore/);
  assert.match(storefront, /<Catalogue[^>]*onCategory=\{goToCollection\}/);
  assert.match(storefront, /<StorefrontDialogs[^\n]*onCategory=\{goToCollection\}/);
});

test("category navigation closes overlays, resets stale filters and scrolls after commit, including reselection", () => {
  const storefront = readFileSync(new URL("../src/components/Storefront.tsx", import.meta.url), "utf8");
  const catalogue = readFileSync(new URL("../src/components/Catalogue.tsx", import.meta.url), "utf8");
  const handler = storefront.slice(storefront.indexOf("const goToCollection"), storefront.indexOf("// Move the actual section"));
  for (const update of ["setCategory(next)", "setMenuOpen(false)", "setDialog(null)", "setNavigationId((id) => id + 1)"]) assert.ok(handler.includes(update), update);
  assert.doesNotMatch(handler, /scrollIntoView/);
  assert.match(catalogue, /setQuery\(""\);[\s\S]*setMaxPrice\(catalogueMaxPrice\);[\s\S]*setReadyNavigation\(navigationId\)/);
  assert.match(catalogue, /readyNavigation !== navigationId/);
  assert.match(catalogue, /requestAnimationFrame/);
  assert.match(catalogue, /return \(\) => cancelAnimationFrame\(frame\)/);
  assert.match(catalogue, /category === "all" \|\| category === "saved" \? "collection" : `category-\$\{category\}`/);
  assert.match(catalogue, /id=\{`category-\$\{group.id\}`\} tabIndex=\{-1\}/);
  assert.match(catalogue, /focus\(\{ preventScroll: true \}\)/);
  assert.match(catalogue, /prefers-reduced-motion: reduce/);
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.match(css, /html \{[^}]*scroll-padding-top: 112px/);
  assert.match(css, /html \{[^}]*scroll-padding-top: 90px/);
});

test("category shortcuts stay in one compact row with bounded square thumbnails", () => {
  const css = readFileSync(new URL("../src/app/heritage.css", import.meta.url), "utf8");
  assert.match(css, /\.category-shortcuts \{[^}]*grid-template-columns: repeat\(7, minmax\(0, 1fr\)\)/);
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

test("the modal grid overrides horizontal strip rules within the responsive layer", () => {
  const css = readFileSync(new URL("../src/app/heritage.css", import.meta.url), "utf8");
  const responsive = css.slice(css.indexOf("@layer responsive"));
  assert.match(responsive, /\.guide-modal \.category-shortcuts-dialog \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[^}]*grid-auto-flow: row;[^}]*grid-auto-columns: auto/);
  assert.match(responsive, /@media \(max-width: 700px\)[\s\S]*\.guide-modal \.category-shortcuts-dialog \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});
