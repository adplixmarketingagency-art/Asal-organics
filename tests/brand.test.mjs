import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { brandLetterPaths, brandFlourishPath, oilDropPath } from "../src/content/brand-artwork.ts";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("shared Tamil wordmark uses vector lettering and an oil-drop pulli on every brand surface", () => {
  const wordmark = source("src/components/BrandWordmark.tsx");
  assert.match(wordmark, /aria-label="அசல்" lang="ta"/);
  assert.match(wordmark, /className="brand-oil-drop"/);
  assert.match(wordmark, /viewBox="0 0 3040 1240"/);
  assert.match(wordmark, /brandLetterPaths\.map/);
  assert.match(wordmark, /d=\{brandFlourishPath\}/);
  assert.doesNotMatch(wordmark, /<image|<script|https?:\/\//);
  for (const component of ["Storefront", "StorefrontDialogs", "CommerceLayout"]) {
    assert.match(source(`src/components/${component}.tsx`), /<BrandWordmark \/>/, component);
  }
  assert.match(source("src/components/BrandIntro.tsx"), /<BrandWordmark animateDrop \/>/);
});

test("custom artwork and raster generator share the same lettering and stable oil-drop anchor", () => {
  assert.equal(brandLetterPaths.length, 3);
  for (const path of [...brandLetterPaths, brandFlourishPath, oilDropPath]) {
    assert.match(path, /^M[\d. ]+[CLHVZ\d.,\sM-]+Z$/);
  }
  assert.match(oilDropPath, /^M2461 10/);
  assert.match(source("scripts/generate-brand-assets.mjs"), /import \{ brandLetterPaths, brandFlourishPath, oilDropPath \} from "\.\.\/src\/content\/brand-artwork.ts"/);
  assert.doesNotMatch(source("src/content/brand-artwork.ts"), /<text|font-family|https?:\/\//);
});

test("Tamil letters share an optical baseline above a full-width curved underline", async () => {
  const bounds = async (path) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="3040" height="1240"><path d="${path}"/></svg>`;
    const { info } = await sharp(Buffer.from(svg)).trim().png().toBuffer({ resolveWithObject: true });
    return {
      left: -info.trimOffsetLeft,
      top: -info.trimOffsetTop,
      right: -info.trimOffsetLeft + info.width,
      bottom: -info.trimOffsetTop + info.height,
      width: info.width,
    };
  };
  const letters = await Promise.all(brandLetterPaths.map(bounds));
  const baselines = letters.map(({ bottom }) => bottom);
  assert.ok(Math.max(...baselines) - Math.min(...baselines) <= 14, "ச and ல must not sit above அ");
  assert.ok(Math.abs(letters[0].top - letters[1].top) <= 14, "அ and ச crowns should align");
  const flourish = await bounds(brandFlourishPath);
  // The tapered tips lose a few transparent pixels when rasterized.
  assert.match(brandFlourishPath, /^M54 1124C[\d ]+2970 1124C/);
  assert.ok(Math.abs(flourish.left - letters[0].left) <= 10, "curve starts under அ");
  assert.ok(Math.abs(flourish.right - letters[2].right) <= 10, "curve ends under ல்");
  assert.ok(flourish.top - Math.max(...baselines) >= 30, "underline stays clear of every letter");
  assert.ok(flourish.bottom - flourish.top >= 50, "retain the visible curved sweep");
  assert.ok(flourish.bottom < 1240, "underline must not clip");
  assert.match(source("scripts/generate-brand-assets.mjs"), /height="\$\{width \* 1240 \/ 3040\}" viewBox="0 0 3040 1240"/);
});

test("file-based Next icons stay in sync with the generated brand assets", () => {
  const apple = readFileSync(new URL("../src/app/apple-icon.png", import.meta.url));
  const publicApple = readFileSync(new URL("../public/apple-touch-icon.png", import.meta.url));
  assert.deepEqual(apple, publicApple);
  for (const [path, size] of [["src/app/icon.png", 512], ["src/app/apple-icon.png", 180]]) {
    const icon = readFileSync(new URL(`../${path}`, import.meta.url));
    assert.equal(icon.subarray(1, 4).toString(), "PNG");
    assert.equal(icon.readUInt32BE(16), size);
    assert.equal(icon.readUInt32BE(20), size);
    assert.ok(source("scripts/generate-brand-assets.mjs").includes(`["${path}", ${size}]`));
  }
});

test("intro drop falls from above the viewport into the final Tamil pulli without drifting below the wordmark", () => {
  const wordmark = source("src/components/BrandWordmark.tsx");
  const intro = source("src/components/BrandIntro.tsx");
  const css = source("src/app/heritage.css");
  assert.match(wordmark, /animateDrop = false/);
  assert.match(wordmark, /animateDrop && <svg className="intro-oil-drip" viewBox="2383 10 156 240"/);
  assert.equal((wordmark.match(/d=\{oilDropPath\}/g) ?? []).length, 2);
  assert.match(css, /top: calc\(10 \/ 1240 \* 100%\); left: calc\(2383 \/ 3040 \* 100%\); width: calc\(156 \/ 3040 \* 100%\); height: calc\(240 \/ 1240 \* 100%\)/);
  assert.match(css, /\.brand-intro \.brand-lettering \.brand-oil-drop \{ visibility: hidden; \}/);
  const keyframes = css.slice(css.indexOf("@keyframes intro-drip"), css.indexOf("/* CSS also dismisses"));
  assert.match(keyframes, /translateY\(calc\(-50vh - 100%\)\)/);
  assert.match(keyframes, /100% \{ transform: translateY\(0\) scale\(1\); \}/);
  assert.doesNotMatch(keyframes, /translateX|translateY\([1-9]|infinite/);
  assert.doesNotMatch(intro + css, /intro-oil-ripple|88\.8%/);
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
