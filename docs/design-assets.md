# Storefront design assets

Updated November 5, 2026. The reference storefront informed navigation and
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
dialog, cart/checkout and page intro. Its vector paths are outlines of the bundled
Noto Sans Tamil at weight 600 (SIL OFL). The final ல் keeps its original letter
shape; only its pulli/dot is replaced by a pointed oil-drop shape. The artwork is
independent of font loading, retains an accessible Tamil label and has no raster
scaling. It is not a new registration or certification claim.

`BrandIntro.tsx` mounts once per full page load in the root layout: a white
background, centred wordmark, one warm-gold oil drip and a small dissipating
ripple. It fades out within 1.4 seconds and is removed after 1.5 seconds.
Internal navigation does not replay it. A key or pointer press dismisses it
immediately; it is inert, hidden from assistive technology and never intercepts
interaction. Reduced-motion visitors skip the intro entirely. A CSS-only exit
also reveals the site when JavaScript is unavailable. This is a brief brand
animation, not a real progress indicator or payment/loading gate.

## Editorial photographs

Downloaded from Unsplash's image CDN as WebP. They illustrate landscape and
food culture, not Asal's farm, facilities, products, sourcing or certifications.

- `public/images/editorial/fields.webp`: golden agricultural landscape at sunset.
  Source: `https://images.unsplash.com/photo-1500382017468-9049fed747ef`
- `public/images/editorial/kitchen-harvest.webp`: market vegetable baskets.
  Source: `https://images.unsplash.com/photo-1464226184884-fa280b87c399`
- Licence reference: `https://unsplash.com/license`

Replace these with owner-supplied lifestyle photographs when available. Do not
use them on product cards or imply that the vegetables are in the catalogue.

## Category photographs

Generated with Gemini in the owner's signed-in Chrome on November 5, 2026,
at the owner's request. Conversation:
`https://gemini.google.com/app/0b24719220d694a9`.
These are AI-generated illustrative category artworks, not photographs of
Asal products, facilities or evidence of a pressing method or certification.
The homepage includes a visible illustrative-image note. Product photographs
remain placeholders.

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
motif. Category headings align directly with their product grids and use vertical
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
