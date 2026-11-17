import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("vegetarian symbol is an accessible green dot inside a square", () => {
  assert.ok(existsSync(new URL("../src/components/VegetarianMark.tsx", import.meta.url)));
  const mark = source("src/components/VegetarianMark.tsx");
  assert.match(mark, /role="img" aria-label="Vegetarian"/);
  assert.match(mark, /viewBox="0 0 24 24"/);
  assert.match(mark, /<rect[^>]*width="20" height="20"[^>]*stroke="currentColor"/);
  assert.match(mark, /<circle cx="12" cy="12" r="5" fill="currentColor"/);
  const css = source("src/app/globals.css");
  assert.match(css, /\.vegetarian-mark \{[^}]*width: 20px; height: 20px;[^}]*flex-shrink: 0;[^}]*color: #008000;[^}]*background: #fff/);
});

test("every outer product card displays the vegetarian symbol beside its identity", () => {
  const card = source("src/components/ProductCard.tsx");
  assert.match(card, /import \{ VegetarianMark \} from "\.\/VegetarianMark"/);
  assert.match(card, /<p className="product-category product-identity">[^<]*\{categoryLabel\(product.category\)\}<VegetarianMark \/><\/p>/);
  assert.match(source("src/app/globals.css"), /\.product-identity \{[^}]*display: flex; align-items: center;[^}]*gap: 8px/);
});

test("opened quick views and full product pages display the same vegetarian symbol", () => {
  for (const path of ["src/components/StorefrontDialogs.tsx", "src/app/products/[id]/page.tsx"]) {
    assert.match(source(path), /import \{ VegetarianMark \}/, path);
    assert.match(source(path), /<p className="eyebrow product-identity">\{categoryLabel\(product.category\)\}<VegetarianMark \/><\/p>/, path);
  }
});
