# Storefront design assets

Updated November 11, 2026. The reference storefront informed navigation and
editorial hierarchy only. No competitor images, branding, certificates or
testimonials were copied.

## Type

Self-hosted variable fonts downloaded from the Google Fonts repository:

- Lora (regular and italic), `ofl/lora`.
- Manrope, `ofl/manrope`.
- Noto Sans Tamil, `ofl/notosanstamil`.

Their SIL Open Font License texts are included in `public/fonts/licenses`.
No visitor requests are made to Google's font service.

## Wordmark and opening animation

`BrandWordmark.tsx` shares the Tamil அசல் logo across the header, footer, about
dialog, product pages, cart/checkout and page intro. Its custom vector paths live
in `src/content/brand-artwork.ts`: fuller bowls, tapered joins, a scooped crown,
cut terminals and a full-width tapered gold curve beneath all three letters.
The ச and ல are enlarged vertically to share அ's optical baseline, rather
than sitting smaller and higher. The curved underline starts at அ's left edge
and finishes at ல்'s right edge, with clear space beneath the lettering.
The taller 3040×1240 canvas prevents clipping, and the intro drop's proportional
bounds are updated with it. The final ல் uses a pointed oil-drop
pulli in the original position. The artwork is
independent of font loading, retains an accessible Tamil label and has no raster
scaling. It is not a new registration or certification claim.

Run `node --experimental-strip-types scripts/generate-brand-assets.mjs` to
regenerate the logo, social preview and icons from this same source.
This includes both the public icon URLs and Next's file-based `app/icon.png`
and `app/apple-icon.png`, so automatic metadata cannot serve the old mark.
The wordmark uses the existing forest green with warm-gold details; the footer
uses a lighter gold for contrast. Small icons retain the oil-drop device.

`BrandIntro.tsx` mounts once per full page load in the root layout: a white
background and centred wordmark. One warm-gold drop falls vertically from above
the viewport and settles into the final ல் pulli. Its endpoint uses the same
path and exact proportional bounds as the static wordmark, so it stays aligned
on phones and desktops. No extra drop or ripple appears below the logo.
It fades out within 1.4 seconds and is removed after 1.5 seconds.
Internal navigation does not replay it. A key or pointer press dismisses it
immediately; it is inert, hidden from assistive technology and never intercepts
interaction. Reduced-motion visitors skip the intro entirely. A CSS-only exit
also reveals the site when JavaScript is unavailable. This is a brief brand
animation, not a real progress indicator or payment/loading gate.

## Editorial photographs

These illustrate landscape and food culture, not Asal's farm, facilities,
products, sourcing or certifications.

- `public/images/editorial/paddy-field.webp`: the green paddy-field photo supplied
  by the owner on November 9, 2026 (`codex-clipboard-19054a9c-4e42-4685-8fdc-57e4279a42dd.png`).
  Converted to WebP quality 85/effort 6, 1024×683, without cropping the stored
  image. The photograph covers the entire hero card as a decorative background,
  not a separate right-hand image panel. Desktop uses a slight 0.6px blur and
  a directional cream overlay: stronger behind the copy, clearer on the right.
  Mobile removes blur entirely and centres the cover crop on the coconut palms.
  On phones (up to 700px), the long description is hidden and the copy starts
  at 108px with tighter button/footnote spacing, keeping the hero compact.
  A 60px upward image offset leaves the palm canopy visible; the cream wash
  increases below it to protect text and controls. Desktop copy and spacing
  are unchanged. The photograph still spans the entire card, rather than
  becoming a separate image panel.
  Its wrapper is aria-hidden with empty alt.
  This replaces the previous Unsplash sunset image, which has been removed.
  Original photographer, location and licence were not supplied; no authorship,
  licence or ownership claim is added. Provenance is recorded on `/credits`.
- `public/images/editorial/kitchen-harvest.webp`: unused legacy market vegetable
  baskets, downloaded from Unsplash's image CDN.
  Source: `https://images.unsplash.com/photo-1464226184884-fa280b87c399`
- Licence reference: `https://unsplash.com/license`

Do not use editorial landscapes on product cards or imply that the legacy
vegetable photograph depicts products in the catalogue.

## Owner-supplied oil packaging

On November 11, 2026 the owner supplied these replacement product images:

| Supplied file | Product ID | Delivery asset prefix |
| --- | --- | --- |
| `Groundnut_oil.png` (1024×1536) | `groundnut` | `groundnut-bottle` |
| `Gingelly_oil.png` (1086×1448) | `sesame` | `gingelly-bottle` |
| `Coconut_oil.png` (1086×1448) | `coconut` | `coconut-bottle` |

Gingelly is sesame oil; the existing product name, ID, prices, and pack choices
are unchanged. Each supplied label says cold pressed and 1 L, so these replace
only the matching cold-pressed product images. Wood-pressed oils retain their
separate ingredient artwork instead of showing differently labelled packaging.

Delivery files live in `public/images/products/` with `-240.webp` and `-800.webp`
suffixes. Sharp resizes each original with `fit: "contain"` onto a white square,
WebP quality 88 / effort 6, keeping the whole bottle and label without cropping,
stretching, repainting or removing anything. All thumbnails are under 7 KB;
all large versions are under 40 KB. The supplied PNGs remain in the owner's
Downloads, not in the public bundle. No independent photography or certification
claim is added.

The shared `ProductImage` component updates cards, quick views, product pages,
search, bag and checkout together. Packaging gets neutral descriptive alt text
and a white surround; ingredient illustrations retain their existing alt-text
disclosure. No new visible labels appear in the shopping UI.

## Category photographs

Generated with Gemini in the owner's signed-in Chrome on November 5, 2026,
at the owner's request. Conversation:
`https://gemini.google.com/app/0b24719220d694a9`.
These are AI-generated illustrative category artworks, not photographs of
Asal products, facilities or evidence of a pressing method or certification.
Matching ingredient studies appear on the remaining product surfaces. At the owner's
request, visible illustrative-image labels and notes are omitted; provenance
remains documented here and in descriptive alt text.

The matching series uses white porcelain dishes, a warm-white studio background,
soft diffused light and uncluttered framing, without branding, text, packaging or
household settings.

| Category asset | Subject | Downloaded original filename |
| --- | --- | --- |
| oils | Golden groundnut oil with a small peanut accent | Gemini_Generated_Image_rk8by3rk8by3rk8b.png |
| wood-oils | Amber sesame oil with a small sesame accent | Gemini_Generated_Image_cll6h2cll6h2cll6.png |
| ghee | Grainy golden ghee in a white ramekin | Gemini_Generated_Image_r6o4icr6o4icr6o4.png |
| masala | Chilli, turmeric and coriander powders in three white dishes | Gemini_Generated_Image_f3pdbzf3pdbzf3pd.png |
| milk | Butter curls on a white saucer | Gemini_Generated_Image_k809kqk809kqk809.png |
| paneer | Paneer pieces on a white plate | Gemini_Generated_Image_t42rxgt42rxgt42r.png |
| rice | Black and red rice in two white bowls | Gemini_Generated_Image_zoo2jzoo2jzoo2jz.png |
| grain | Ragi and bajra flours in white bowls with small millet accents | Gemini_Generated_Image_ayh5wdayh5wdayh5.png |

The 2048 × 2048 PNG originals are retained locally in
`docs/assets/category-originals` and excluded from Git to avoid shipping 52 MB
of source artwork. The table above records their original download names.
Self-hosted delivery assets in `public/images/categories` are 800 × 800 WebP
(quality 86, effort 6), each under 100 KB. Originals were only resized/encoded:
no repainting or watermark removal. Cards use decorative empty alt text alongside
their bilingual category labels, lazy loading and explicit dimensions.

Category navigation is a compact, single-row browse strip, separate from the
product catalogue. All eight shortcuts fit on desktop, with 96 px square images
and centred English/Tamil labels. Below 1100 px the row scrolls horizontally
instead of wrapping into large cards; on phones the images reduce to 80 px.
Native scrolling, scroll snapping, a browse hint and visible keyboard/selected
states keep every category reachable without adding a carousel dependency.

## Kolam

The owner supplied two kolam reference sheets on November 5, 2026 and requested
their looped motifs and horizontal section-line designs:

- Motif sheet: `codex-clipboard-bf6445ca-2269-4279-8b92-4d4491c12ceb.png`.
- Border sheet: `codex-clipboard-4f028a4c-0e90-4859-af83-6f5e4a279c23.png`.

The initial enlarged raster cutouts were rejected for softness and excessive
repetition. They have been removed, not upscaled again.

- `public/images/kolam-sikku.svg`: new Bézier linework based on the fourth-row
  centre motif, with a diamond lattice, returning loops and a nine-dot grid.
- `public/images/kolam-border.svg`: a short, closed interlaced curve inspired by
  the border sheet. Constructed as `x = 80 + 72 cos(t), y = 20 + 12 sin(5t)`,
  represented by 64 tangent-matched cubic Bézier segments.

Both are genuine SVG paths, not embedded bitmaps or auto-traced pixel edges.
They have transparent backgrounds and consistent warm-brass strokes. They remain
sharp at high device pixel ratios without a larger download. They contain no
scripts, external references, font dependencies or opaque background shapes.

The supplied sheets are visual references, not independently verified
public-domain assets. No ownership or licence is asserted for the references;
the SVG files are newly drawn adaptations, not licensed stock artwork.

### Restrained placement

Keep the existing paper `#fffdf8`, ink `#254237`, sage `#64705f`, brass `#8a6a42`
and pale green `#f1f0e5`, with Lora headings, Manrope body text and Noto Sans Tamil.
The kolam is a Tamil heritage accent, not a repeating page texture.

Use only two short (maximum 344 px desktop / 272 px mobile) ornamental separators:
before the collection and before the FAQ. Hero and footer use a small standalone
motif. The hero motif is anchored to the whole card's top-right corner, not its
narrower text column: 72px with 24px insets on desktop, 52px with 16px insets on
mobile. Category headings align directly with their product grids and use vertical
spacing, not ornamental rules or repeated icons. Checkout has no decorative
separator. The story's background and photograph supply its visual distinction.

Everything is self-hosted. Decorative uses have empty alt text, `aria-hidden`,
explicit dimensions and no pointer interaction.

## Tamil copy and certificates

All 20 product names and eight category labels include Tamil. Cold-pressed oils
use **செக்கு எண்ணெய்**; wood-pressed oils use **மரச்செக்கு எண்ணெய்**, as
specified by the owner. Ghee and paneer have separate categories. The owner
confirmed separate wood-pressed Groundnut, Sesame and Coconut products on
November 5, 2026; the original cold-pressed oils remain. See `docs/catalogue.md` for
the pack-size transcription and pricing safeguards. Owner review is recommended,
particularly Bilona transliterations and the all-purpose curry masala label.

The owner has stated that an FSSAI certificate exists. No licence number, official
logo, downloadable certificate or verified badge is published without the
actual document/details. Supply the current certificate, licence number and
validity dates before adding that section. Do not reuse the reference site's
certificate.

## Ingredient studies and contextual heritage art — November 9, 2026

Created at the owner's request using Gemini in their signed-in Chrome:
`https://gemini.google.com/app/638e845e4f132de4`.
No credentials, private project files or personal reference photos were uploaded.

### Ingredient studies

The new still lifes match the existing warm-white porcelain category series.
They are not photographs of merchandise, not packaging previews and not proof
of a production method. The 20 product IDs map to 17 ingredient studies in
`src/content/product-images.ts`; cold/wood-pressed versions share the same
ingredient illustration. Ragi/Bajra availability and all prices are unchanged.

| Original download | Complete cells (top-left, top-right, bottom-left, bottom-right) |
| --- | --- |
| `Gemini_Generated_Image_ppmaj0ppmaj0ppma.png` | Coconut oil, turmeric, chilli powder, coriander powder |
| `Gemini_Generated_Image_6snw7m6snw7m6snw.png` | Curry masala, palkova, black-rice halwa, Seera Samba rice |
| `Gemini_Generated_Image_9j2wep9j2wep9j2w.png` | Black rice, red rice, ragi flour, bajra flour |

Prompt direction: a square 2×2 contact sheet, four complete and generously spaced
still lifes; accurate ingredient colours/textures; soft studio light; white
porcelain on warm-white; no packaging, labels, branding or invented endorsements.
The source PNGs are 2048×2048. Each full quadrant was extracted without repainting
or watermark removal, then encoded at 240×240 and 800×800, WebP quality 84/effort 6.
Groundnut oil, sesame oil, ghee, butter and paneer reuse the corresponding existing
category artwork, with the same two output sizes. Originals remain in the local
Downloads directory (and category originals in the ignored source-art folder).

`ProductImage` provides dimensions, descriptive illustrative alt text, responsive
sources and lazy loading (except the main product-page image). Cards and detail
views no longer carry AI/illustrative labels, and repeated image disclosures in
search/cart/category pages are removed at the owner's request. Descriptive alt
text retains the artwork context. Unknown future product IDs retain the placeholder.
Use owner-supplied product photography to replace these when available.

### Heritage illustrations

| Asset | Original download | Subject |
| --- | --- | --- |
| `chekku` | `Gemini_Generated_Image_ah1emzah1emzah1e.png` | Bullock-driven wooden press in a shaded Tamil courtyard |
| `bilona` | `Gemini_Generated_Image_lu12g6lu12g6lu12.png` | Rope-driven wooden churn, curd pot, hands and butter bowl |
| `cattle` | `Gemini_Generated_Image_ty20fyty20fyty20.png` | White zebu cow and calf beside a cattle shed |

Prompt direction: fine gouache/coloured-pencil editorial illustration, landscape
3:2, ivory, forest green and ochre, quiet rural composition; no logo or text.
Originals are 2528×1696, resized without cropping to widths 640/1200 and WebP
quality 83/effort 6. At the owner's direction there is no standalone gallery or
freestanding artwork: chekku is the wood-oils section background, bilona the
ghee background, and cow/calf the milk-products background. Absolute decorative
layers sit outside the product grid, with a soft 3px desktop blur, 0.86 opacity
and a directional cream wash. All three landscapes fill their entire section,
behind both the heading and product rows, matching the owner's preferred bilona
composition. A 9px image bleed prevents hard blur edges; `object-fit: cover`
preserves proportions. They share a 210px heading minimum, with no short
right-aligned banners or extra heading gaps for chekku/cattle.
Mobile uses separately generated square vignettes, selected by a native
`picture` source at up to 700px. This desktop adjustment leaves the mobile
artwork and layout unchanged.
The vignette shares the heading's grid cell, tucked to its upper right at
`min(48vw, 240px)`, rather than filling a banner below the text. Copy uses a
separate column and the pack-size line spans both columns. The old 54% bottom
padding is removed; headings use a compact 194px minimum with 24px bottom padding.
Images preserve their square aspect ratio with `height: auto` and `object-fit:
contain`, independent of product-grid height. A soft radial edge, multiply blend,
0.25px blur and 0.88 opacity merge the paper into the section without rectangular
edges. It stays a section background, never a gallery or a product-grid item.
Only background images are softened; product cards, headings, prices and
controls remain sharp. Background wrappers clip artwork, not controls or focus
rings.
Decorative images have empty alt text and an aria-hidden wrapper, with no
captions. The generated provenance remains in this record and on `/credits`,
not as labels on the shopping surfaces.

#### Mobile vignettes — Gemini, November 9, 2026

Generated through Gemini in the owner's Chrome at their request, in one
conversation for a consistent style. Original PNGs are 2048×2048; output files
are 640×640 WebP, quality 84/effort 6, each under 40KB. No crop or distortion.

| Output in `public/images/heritage/` | Original Gemini filename | Subject |
| --- | --- | --- |
| `bilona-mobile.webp` | `Gemini_Generated_Image_3sxen73sxen73sxe.png` | Terracotta churn, wooden spindle and brass ghee bowl |
| `chekku-mobile.webp` | `Gemini_Generated_Image_yf496ayf496ayf49.png` (November 10 replacement) | White Tamil bullock harnessed to a wooden chekku, with brass oil bowl |
| `cattle-mobile.webp` | `Gemini_Generated_Image_c6rmdfc6rmdfc6rm.png` | White zebu cow with a light-brown calf |

Shared prompt direction: square isolated watercolor-and-ink editorial vignette,
warm ivory `#fffdf8` paper, central subject occupying 65–70%, generous blank edges,
muted olive, terracotta and gold, soft ground shadow, recognizable at 140–150px.
No room, landscape, frame, lettering, logo or UI. These are decorative
illustrations, not evidence of the store's facilities, animals or production.

On November 10 the owner requested an animal-driven chekku instead of the
isolated mobile press. Generated a new square watercolor through Gemini in
the owner's Chrome: complete white native Tamil bullock, horns and four legs,
visibly joined by a wooden beam to a traditional cylindrical marachekku and
upright pestle; brass sesame-oil bowl; muted sage, wood and cream, generous
ivory margins, no people, scenery or lettering. Source is 2048×2048, resized
without cropping to the same 640×640 WebP budget. The desktop courtyard scene
and the shared soft background treatment are unchanged. The mobile wood-oil
heading reserves space for the full vignette, keeping pack sizes below the
animal and press instead of crossing them.

### Nammalvar photograph — CC BY-SA 3.0

- Source: https://commons.wikimedia.org/wiki/File:Nammalvar.G.jpg
- Original: https://upload.wikimedia.org/wikipedia/commons/d/d0/Nammalvar.G.jpg
- Author: **Voiceoftamil**.
- Licence: **Creative Commons Attribution-ShareAlike 3.0 Unported**,
  https://creativecommons.org/licenses/by-sa/3.0/.
- Output: `public/images/heritage/nammalvar.webp`, 778×434, WebP quality 86.
  Converted from JPEG, not cropped or retouched; this derivative remains
  available under **CC BY-SA 3.0**. No additional restrictions are imposed.
- The caption now shows only Nammalvar's name and dates. Attribution, source,
  licence and encoding details live on `/credits`, linked from the storefront
  footer. The complete image remains visible at all viewport sizes.
- Desktop retains the remembrance directly after the hero, before category
  shortcuts and products. On phones (up to 700px), it is the last main section,
  after the catalogue, FAQ and closing note, before the footer.
  A subscribed media query moves a single rendered section so keyboard and
  reading order match the layout, including after resizing. A mobile-only CSS
  fallback places it last before hydration or without JavaScript. The existing
  `#our-way` navigation still targets the unique remembrance.

G. Nammalvar (1938–2013) is presented in a neutral editorial remembrance of his
natural-farming advocacy. No quote, commercial endorsement or affiliation is
invented. This real photograph is deliberately distinguished from the generated
heritage artwork. The unused market-vegetable photo remains available as a legacy
asset, but is no longer used in the story section.
