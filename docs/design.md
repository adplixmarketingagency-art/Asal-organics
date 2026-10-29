# Asal — design direction

A white, forest-green, and powder-blue wood-pressed oil collection. Built from a greenfield brief; the Asal name is taken from the workspace name, pending user confirmation.

## Inspo study
- Mooala (https://mooala.com): ingredient-led photography and editorial serif headings.
- Good Eggs (https://goodeggs.com): white retail surfaces, straightforward navigation and category discovery.
- Blue Bottle (https://bluebottlecoffee.com): quiet product presentation and deliberate blue accents.
- Reference collection: https://aishwaryamoils.com/collections/wood-pressed-oils?sort_by=best-selling

## Visual spec
- 1440px maximum content, 64px desktop / 24px mobile gutters.
- Forest #173f34; mid-green #48745b; blue #e8f2f8; blue-ink #365e78; white #ffffff.
- Locally hosted Fraunces editorial display with DM Sans UI; approximately 58px desktop / 43px mobile hero.
- Announcement, clean horizontal header, breadcrumb, powder-blue/photo split hero (approximately 450px tall), ingredient/process strip, collection tabs and four-column catalogue, green process section, FAQ, dark-green footer.
- Four-column product grid, three columns on tablet, two on mobile; thin dividers and restrained roundness. No hero image overlays or gradients.
- Functional search, filters, sort, product details, oil guide, FAQ, locally saved favourites, responsive mobile navigation.

## Explicit limitations
- Image generation tool unavailable. No generated/approved raster concept exists; the textual visual spec is the implementation reference.
- Cart and pre-payment checkout are implemented; see `checkout.md`. No order creation, stock reservation or payment confirmation is implemented. Merchant products, shipping, tax and Razorpay remain prerequisites for live orders.
- Product names, prices and photos are public reference material from Aishwaryam Oils and are attributed visibly. They are not an assertion of Asal's own inventory, certification, reviews or business claims.
- Hero photo from Unsplash: https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5 ; editorial styling only, not an Asal product photo.
- Replace reference photography and product data with licensed merchant-owned assets before production publication.

## Running locally
- `npm run dev -- --port 3100` (port 3000 was already serving another project).
- `npm run build`, `npm run typecheck`, `npm test`.
- `/` and `/collections/wood-pressed-oils` show the collection; `/cart` and `/checkout` provide the pre-payment flow.
- Preview pages deliberately use `noindex`.
- Commerce discovery via Vercel 65.7.0 completed on 29 October 2026 and returned Shopify. No store was provisioned: the requested flow stops before the user's planned Razorpay integration.
- To prepare deployment and commerce provisioning, install the CLI with `npm i -g vercel`, run `vercel login`, and connect the merchant-owned store. Do not deploy these reference products as Asal inventory.
