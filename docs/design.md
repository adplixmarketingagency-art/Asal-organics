# Asal — design direction

Updated November 9, 2026.

Cream paper, forest-green ink, muted sage and warm brass, with self-hosted Lora,
Manrope and Noto Sans Tamil. Retain restrained kolam dividers and bilingual labels.
See `design-assets.md` for provenance, licences and image-use limitations.

## Current catalogue

- 20 owner-listed products across eight categories.
- Only approved selling prices and quantities; pack prices round up proportionally.
- Ragi/Bajra remain unavailable with “Price pending” until base quantities are confirmed.
- Coordinated, explicitly illustrative ingredient images in cards, quick views,
  search, product pages and bag lines. No invented packaging or actual-product claims.
- No added certifications, endorsements, farm ownership or delivery promises.

## Layout

- Split landscape hero, compact category strip, four-column desktop catalogue,
  three columns on tablet and two on mobile; search/filter/list views preserved.
- Square desktop image spaces and 4:3 mobile compositions, full subjects contained,
  self-hosted 240/800px WebP, stable dimensions, lazy loading below the fold.
- Credited, uncropped Nammalvar photograph with a neutral editorial remembrance.
- Heritage illustrations are scattered through existing content, not a gallery:
  a small wooden-chekku scene beside the wood-oils heading, bilona churning in the
  breathing room beside ghee, and cow/calf artwork tucked beside dairy products.
  Different sizes and alignments keep the placement informal; responsive layouts
  preserve complete subjects and keep product controls unobstructed.
- Accessible focus, descriptive alt text, visible AI-image disclosures and
  reduced-motion treatment. No new animation or carousel dependencies.

## Verification and deployment

- `npm test`, `npm run typecheck`, isolated `npm run build:cloudflare`.
- Public homepage, wood-oils collection and 20 product URLs remain indexable.
  Cart/checkout remain noindex; actual ordering and payments remain unavailable.
- Browser QA at desktop and mobile widths, including modal, search, list and bag.
- Push to the existing GitHub repository to trigger Cloudflare Workers Builds.
  No platform migration or environment/secret files included in the build.
