import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { products } from "../src/content/products.ts";
import { productImages } from "../src/content/product-images.ts";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("all 20 product IDs have appropriate self-hosted product images", () => {
  assert.deepEqual(Object.keys(productImages).sort(), products.map(({ id }) => id).sort());
  assert.equal(new Set(Object.values(productImages).map(({ asset }) => asset)).size, 20);
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
  assert.notEqual(productImages.palkova.asset, productImages["bilona-butter"].asset);
  assert.notEqual(productImages["karuppu-kavuni"].asset, productImages["karuppu-kavuni-halwa"].asset);
});

test("owner-supplied bottles match the cold-pressed oils with separate wood-pressed assets", () => {
  for (const [id, asset, name] of [
    ["groundnut", "groundnut-bottle-v2", /groundnut/i],
    ["sesame", "gingelly-bottle", /gingelly.*sesame/i],
    ["coconut", "coconut-bottle", /coconut/i],
  ]) {
    const image = productImages[id];
    assert.equal(image.asset, asset);
    assert.equal(image.kind, "packaging");
    assert.match(image.alt, name);
    assert.match(image.alt, /Asal Organics.*cold-pressed.*1 litre/);
    assert.notEqual(image.asset, productImages[`wood-${id}`].asset);
  }
});

test("wood-pressed oils use the matching owner-supplied wood-pressed bottle labels", () => {
  for (const [id, asset, name] of [
    ["wood-groundnut", "wood-groundnut-bottle", /groundnut/i],
    ["wood-sesame", "wood-gingelly-bottle", /gingelly.*sesame/i],
    ["wood-coconut", "wood-coconut-bottle", /coconut/i],
  ]) {
    const image = productImages[id];
    assert.equal(image.asset, asset);
    assert.equal(image.kind, "packaging");
    assert.match(image.alt, name);
    assert.match(image.alt, /Asal Organics.*wood-pressed.*1 litre/);
    assert.doesNotMatch(image.alt, /cold-pressed|illustrat/i);
    assert.notEqual(image.asset, productImages[id.replace("wood-", "")].asset);
  }
});

test("shared image rendering preserves descriptive alt text and controls loading without visible labels", () => {
  const component = source("src/components/ProductImage.tsx");
  assert.match(component, /alt=\{image.kind === "packaging" \? image.alt :/);
  assert.match(component, /image.kind === "packaging" \? "product-artwork-packaging"/);
  assert.match(source("src/app/imagery.css"), /\.product-artwork-packaging \{ background: #fff; \}/);
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
  assert.match(css, /\.category-backdrop > img \{[^}]*filter: blur\(3px\)[^}]*opacity: \.86/);
  assert.doesNotMatch(css, /\.(?:category-section|product-grid|category-section-heading|category-heading-copy|product-card) \{[^}]*filter:/);
});

test("mobile heritage vignettes are art-directed without downloading desktop scenes", () => {
  const illustration = source("src/components/HeritageIllustration.tsx");
  assert.match(illustration, /return <picture className=\{`category-backdrop/);
  assert.match(illustration, /<source media="\(max-width: 700px\)" srcSet=\{`\$\{path\}-mobile\.webp`\} width="640" height="640"/);
  assert.match(illustration, /<\/picture>/);
  for (const asset of ["chekku", "bilona", "cattle"]) {
    const bytes = readFileSync(new URL(`../public/images/heritage/${asset}-mobile.webp`, import.meta.url));
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
    assert.equal(bytes.readUInt16LE(26) & 0x3fff, 640);
    assert.equal(bytes.readUInt16LE(28) & 0x3fff, 640);
    assert.ok(bytes.byteLength < 40_000, `${asset} mobile art exceeds budget`);
  }
});

test("mobile artwork blends beside heading copy without a separate banner or stretching", () => {
  const css = source("src/app/imagery.css");
  const mobile = css.slice(css.indexOf("@media (max-width: 700px)"), css.indexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(mobile, /\.category-section:has\(> \.category-backdrop\) \{[^}]*display: grid/);
  assert.match(mobile, /\.category-backdrop \{[^}]*grid-area: 1 \/ 1;[^}]*position: relative;[^}]*align-self: start; justify-self: end/);
  assert.match(mobile, /\.category-backdrop \{[^}]*width: min\(48vw, 240px\)[^}]*mix-blend-mode: multiply/);
  assert.match(mobile, /\.category-backdrop > img \{[^}]*width: 100%; height: auto; aspect-ratio: 1; object-fit: contain/);
  assert.match(mobile, /\.category-backdrop > img \{[^}]*filter: blur\(\.25px\)[^}]*opacity: \.88/);
  assert.match(mobile, /\.category-backdrop > img \{[^}]*mask-image: radial-gradient/);
  assert.match(mobile, /\.category-backdrop::after \{ content: none/);
  // Art is bounded to the heading, and copy keeps its own readable column.
  assert.match(mobile, /\.category-section-heading \{[^}]*grid-area: 1 \/ 1; min-height: 194px; padding-bottom: 24px/);
  assert.match(mobile, /\.category-heading-copy \{[^}]*grid-template-columns: minmax\(0, 1fr\) min\(36%, 190px\)/);
  assert.match(mobile, /\.category-pack-sizes \{ grid-column: 1 \/ -1/);
  assert.doesNotMatch(mobile, /padding-bottom: \d+%/);
  assert.doesNotMatch(mobile, /--heritage-scene-height|object-fit: cover/);
  assert.doesNotMatch(mobile, /\.category-backdrop > img \{[^}]*height: (?:100%|calc\(100%|\d+px)/);
});

test("desktop heritage backgrounds fill every illustrated section with the same soft treatment", () => {
  const css = source("src/app/imagery.css");
  const desktop = css.slice(0, css.indexOf("@media (max-width: 700px)"));
  assert.match(desktop, /\.category-backdrop \{[^}]*inset: -20px -24px/);
  assert.match(desktop, /\.category-backdrop > img \{[^}]*inset: -9px;[^}]*width: calc\(100% \+ 18px\);[^}]*height: calc\(100% \+ 18px\);[^}]*object-fit: cover;[^}]*filter: blur\(3px\)/);
  assert.match(desktop, /\.category-section:has\(> \.category-backdrop\) \.category-section-heading \{ min-height: 210px/);
  // No subject-specific short banners or extra heading gaps on oils/dairy.
  assert.doesNotMatch(desktop, /\.category-backdrop-(?:chekku|bilona|cattle)[^{]*\{[^}]*(?:width|height|inset|filter|mask-image):/);
  assert.doesNotMatch(desktop, /mask-image:|height: 400px|width: 76%|min-height: 310px/);
});

test("the supplied green field remains and Nammalvar moves only on mobile with one accessible section", () => {
  const storefront = source("src/components/Storefront.tsx");
  assert.match(storefront, /src="\/images\/editorial\/paddy-field.webp"[^>]*width="1024" height="683" fetchPriority="high"/);
  assert.doesNotMatch(storefront, /fields.webp|Golden fields|Landscape inspiration|hero-landscape/);
  assert.match(storefront, /className="hero-backdrop" aria-hidden="true"><img[^>]*alt=""/);
  const css = source("src/app/heritage.css");
  assert.match(css, /\.hero \{[^}]*position: relative;[^}]*isolation: isolate/);
  assert.match(css, /\.hero-backdrop \{[^}]*position: absolute; inset: 0/);
  assert.match(css, /\.hero-backdrop > img \{[^}]*filter: blur\(\.6px\)/);
  assert.doesNotMatch(css, /\.(?:hero|hero-copy) \{[^}]*filter:/);
  const hero = storefront.indexOf('className="hero"');
  const desktopStory = storefront.indexOf("{!mobileLayout && nammalvarStory}");
  const catalogue = storefront.indexOf("<Catalogue ");
  const editorial = storefront.indexOf("<Editorial ");
  const mobileStory = storefront.indexOf("{mobileLayout && nammalvarStory}");
  assert.ok(hero >= 0 && hero < desktopStory && desktopStory < catalogue && catalogue < editorial && editorial < mobileStory);
  assert.equal((storefront.match(/<NammalvarStory /g) || []).length, 1);
  assert.match(storefront, /useSyncExternalStore\(subscribeToMobileLayout, getMobileLayout, getServerLayout\)/);
  assert.match(storefront, /mobileLayoutQuery = "\(max-width: 700px\)"/);
  assert.match(storefront, /query\.addEventListener\("change", onChange\)/);
  assert.match(storefront, /return \(\) => query\.removeEventListener\("change", onChange\)/);
  assert.match(storefront, /getServerLayout = \(\) => false/);
  const mobile = css.slice(css.indexOf("@media (max-width: 700px)"));
  // CSS puts the SSR story last before hydration, avoiding a large mobile layout shift.
  assert.match(mobile, /\.storefront-main \{ display: flex; flex-direction: column/);
  assert.match(mobile, /\.storefront-main > \.story-band \{ order: 1/);
  assert.doesNotMatch(css.slice(0, css.indexOf("@media (max-width: 700px)")), /\.storefront-main/);
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

test("the hero kolam sits beside the headline instead of over the farm photograph", () => {
  const storefront = source("src/components/Storefront.tsx");
  const heroStart = storefront.indexOf('<section className="hero"');
  const hero = storefront.slice(heroStart, storefront.indexOf("</section>", heroStart));
  const copy = hero.indexOf('<div className="hero-copy">');
  assert.equal((hero.match(/<Kolam className="hero-kolam"/g) || []).length, 1);
  assert.ok(hero.indexOf('<Kolam className="hero-kolam" />') > copy);
  assert.match(hero, /<span className="hero-title-end"><em>\{isWoodOilsPage \? "oils" : "Angadi"\}<\/em><Kolam className="hero-kolam" \/><\/span>/);
  const css = source("src/app/heritage.css");
  assert.match(css, /\.hero-title-end \{ display: flex; align-items: center; gap: 24px; \}/);
  assert.match(css, /\.hero-kolam \{ width: 72px; height: 72px; \}/);
  for (const rule of css.matchAll(/\.hero-kolam \{([^}]*)\}/g)) {
    assert.doesNotMatch(rule[1], /position:|(?:top|right|bottom|left):|opacity:|transform:/);
  }
  const mobile = css.slice(css.indexOf("@media (max-width: 700px)"));
  assert.match(mobile, /\.hero-title-end \{ gap: 20px; \}/);
  assert.match(mobile, /\.hero-kolam \{ width: 48px; height: 48px; \}/);
});

test("the mobile hero keeps its clear farm image and compact copy", () => {
  const storefront = source("src/components/Storefront.tsx");
  const css = source("src/app/heritage.css");
  const mobile = css.slice(css.indexOf("@media (max-width: 700px)"));
  assert.match(mobile, /\.hero-backdrop > img \{[^}]*filter: none/);
  assert.match(mobile, /\.hero-backdrop > img \{[^}]*object-position: 54% top/);
  assert.match(mobile, /\.hero-copy \{[^}]*padding: 108px 24px 24px/);
  assert.doesNotMatch(storefront, /hero-description|hero-footnote/);
  assert.match(mobile, /\.hero \.button \{ margin-top: 8px/);
  assert.match(mobile, /\.hero-backdrop > img \{[^}]*inset: -60px 0 0/);
  assert.doesNotMatch(css, /\.(?:hero|hero-copy|hero-description) \{[^}]*filter:/);
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
