import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("shared Tamil wordmark uses vector lettering and an oil-drop pulli on every brand surface", () => {
  const wordmark = source("src/components/BrandWordmark.tsx");
  assert.match(wordmark, /aria-label="அசல்" lang="ta"/);
  assert.match(wordmark, /className="brand-oil-drop"/);
  assert.match(wordmark, /viewBox="0 0 3040 1110"/);
  assert.doesNotMatch(wordmark, /<image|<script|https?:\/\//);
  for (const component of ["BrandIntro", "Storefront", "StorefrontDialogs", "CommerceLayout"]) {
    assert.match(source(`src/components/${component}.tsx`), /<BrandWordmark \/>/, component);
  }
});

test("opening animation is finite, nonblocking, reduced-motion aware and mounted only in the root", () => {
  const intro = source("src/components/BrandIntro.tsx");
  const css = source("src/app/heritage.css");
  assert.match(intro, /aria-hidden="true" inert/);
  assert.match(intro, /setTimeout\(dismiss, 1500\)/);
  assert.match(intro, /prefers-reduced-motion: reduce/);
  assert.match(intro, /removeEventListener\("keydown", dismiss\)/);
  assert.match(css, /\.brand-intro \{[^}]*background: #fff;[^}]*pointer-events: none;[^}]*intro-dismiss 1.4s/);
  assert.match(css, /\.brand-intro \{ display: none; animation: none; \}/);
  assert.match(css, /100% \{ opacity: 0; visibility: hidden; \}/);
  assert.equal((source("src/app/layout.tsx").match(/<BrandIntro \/>/g) ?? []).length, 1);
});
