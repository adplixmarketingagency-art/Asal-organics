# Asal — design direction

White, forest-green and powder-blue surfaces, with local Fraunces headings and DM Sans UI. The existing navigation, filters, saved favourites, cart and pre-payment checkout remain available.

## Current catalogue

- 17 products across five categories, transcribed from the two owner-provided handwritten lists.
- Only listed selling prices and quantities; no production costs, comparison prices or crossed-out products.
- Ragi and Bajra have prices but no stated quantities. Show that explicitly and reject these items in both browser cart and server checkout until confirmed.
- Reserved image spaces in product cards, search results, detail dialogs and cart lines, ready for merchant photography. The hero also retains an image space. No old product or editorial photographs; the brand credit icon is retained.
- No added certifications, delivery promises or ingredient/process claims.

## Layout

- Existing 1440px content width, forest-green / powder-blue palette and restrained borders.
- Split hero and four-column product grid with neutral photo placeholders; three columns on tablet and one on phones to accommodate full product names and prices.
- Search, category filters, price filters, sorting, details, category guide, FAQs and responsive navigation.

## Verification and deployment

- `npm test`, `npm run typecheck`, `npm run build:cloudflare`.
- `/` and the retained legacy `/collections/wood-pressed-oils` URL show the collection.
- `/cart` and `/checkout` provide a review only; payments remain disabled.
- Deploy to the existing Cloudflare Worker with `npm run deploy`; preserve its Custom Domain configuration.
- Stock, missing grain quantities, delivery rules and taxes must be confirmed before live ordering. Preview pages remain `noindex`.
