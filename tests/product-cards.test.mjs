import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("compact cards keep pack selection, details, Tamil names and accessible purchasing", () => {
  const card = source("src/components/ProductCard.tsx");
  assert.match(card, /className="product-purchase"/);
  assert.match(card, /className="product-price"[\s\S]*className="product-add"[\s\S]*<\/button>\s*<\/div>/);
  assert.match(card, /aria-label=\{`View \$\{product.name\} details`\}/);
  assert.match(card, /<h3><Link href=\{productPath\(product\)\}[^>]*>\{product.name\}<\/Link><\/h3>/);
  assert.match(card, /lang="ta">\{product.tamilName\}/);
  assert.match(card, /aria-label=\{`\$\{product.name\} pack size`\}/);
  assert.match(card, /disabled=\{!ready \|\| !variant\}/);
  assert.match(card, /addItem\(product.id, variant\?\.id\)/);
  assert.doesNotMatch(card, /explore-button|product-bottom/);
});

test("compact grid uses bounded desktop cards, two mobile columns and shallow imagery", () => {
  const css = source("src/app/globals.css");
  const heritage = source("src/app/heritage.css");
  assert.match(css, /\.product-grid \{[^}]*repeat\(4,minmax\(0,260px\)\)/);
  assert.match(css, /\.product-media \{[^}]*aspect-ratio: 16 \/ 9/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*\.product-grid \{[^}]*repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(heritage, /\.product-purchase \.product-add \{[^}]*min-height: 44px/);
  assert.match(heritage, /\.product-card \.save-button \{ width: 44px; height: 44px; \}/);
  assert.doesNotMatch(heritage, /\.product-info \{ padding: 22px; \}|\.product-info h3 \{ font-size: 1\.6rem/);
});

test("wood-pressed category guide no longer claims the confirmed products are pending", () => {
  assert.doesNotMatch(source("src/components/StorefrontDialogs.tsx"), /wood-pressed product details are being confirmed/);
});

test("catalogue FAQ describes available proportional pack prices", () => {
  const editorial = source("src/components/Editorial.tsx");
  assert.match(editorial, /cold-pressed and wood-pressed oils/);
  assert.match(editorial, /Pack prices are proportional/);
  assert.doesNotMatch(editorial, /Only the previously priced|Prices for the additional sizes are still being confirmed/);
});
