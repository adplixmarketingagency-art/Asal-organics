# Asal Organics

A Next.js App Router storefront with a 20-product catalogue, product discovery, saved favourites, a persistent browser cart and Razorpay Standard Checkout (sandbox enabled; live payments gated).

## Development

Requires Node.js 22 or later.

```sh
npm ci
# Configure .env from .env.example for sandbox checkout.
npm run dev
```

## Verification

```sh
npm test
npm run typecheck
npm run build
```

`npm run build` creates the complete Cloudflare OpenNext bundle without deploying.
Use `npm run build:next` only when a plain Next.js build is specifically needed.
Build release artifacts from a clean checkout without local `.env*` or `.dev.vars*`
files. Payment credentials belong in Worker runtime secrets, not build variables.

## Routes

- `/`: Asal Iyarkai Angadi storefront and full catalogue
- `/collections/wood-pressed-oils`: dedicated wood-pressed oil collection
- `/robots.txt` and `/sitemap.xml`: search-engine discovery
- `/cart`: bag quantities, removal and subtotal
- `/checkout`: delivery details, checkout review and Razorpay test/live payment UI
- `POST /api/checkout`: validate details and recalculate catalogue pricing
- `POST /api/create-order`: create a server-priced Razorpay order
- `POST /api/verify-payment`: verify the signature and captured payment
- `GET /api/payments/config`: nonsecret payment availability

## Cloudflare Workers deployment

Production deploys automatically through the existing Cloudflare Git integration
when commits are pushed to `main`. Use Git push for normal releases; do not also
run a manual Wrangler deployment.

This project uses the OpenNext Cloudflare adapter. Wrangler is installed locally;
the Worker name and account are configured in `wrangler.jsonc`.

Keep these settings in Cloudflare Workers Builds:

| Setting | Value |
| --- | --- |
| Root directory | `/` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

The build script runs OpenNext, which invokes `npm run build:next` once before
generating `.open-next/worker.js`, `.open-next/assets` and the compiled adapter
configuration. A plain `next build` only produces `.next`; deploying that alone
fails with “Could not find compiled Open Next config”.

Cloudflare runs the deploy command automatically after the build. Do not execute
it locally for a normal Git release. These commands are for local preview or an
explicitly requested manual deployment only:

```sh
npx wrangler whoami
npm run preview # Build and test in the local Workers runtime
npm run deploy  # Isolated, secret-free build; deploy asal-organics with its Custom Domain
```

The storefront's primary address is `https://asaliyarkaiangadi.in/`.
This configuration disables the alternate `workers.dev` address and version
preview URLs on the next deployment.
`wrangler.jsonc` attaches `asaliyarkaiangadi.in` as a Workers Custom Domain using
`custom_domain: true`. Cloudflare manages the apex DNS record and TLS certificate
for the Worker. The old Hostinger apex A record and wildcard Worker route have
been removed; the existing proxied `www` CNAME is preserved. A Worker route for
`www.asaliyarkaiangadi.in/*` now handles the permanent redirect to the HTTPS apex
address before the old origin is contacted. The Next.js redirects preserve paths
and query strings and redirect HTTP apex requests using Cloudflare's
`X-Forwarded-Proto` header.

For routing-only changes, run `npx wrangler triggers deploy` without rebuilding
or uploading another Worker version. The domain's nameservers are
`lewis.ns.cloudflare.com` and `mira.ns.cloudflare.com`; a resolver caching the old
Hostinger records can still display its parked page until that cache expires.

The deployment script builds a temporary source-only copy, excluding local
`.env*`, credentials and generated output. Only its Worker bundle and assets are
deployed. Sandbox payments are enabled using test credentials stored as Worker
secrets; the script never uploads `.env`. No merchant database is required for
sandbox. Real payments remain gated; follow `docs/payments.md` before launch.

No R2 cache or Cloudflare Images service is configured. The current site does not
use ISR, and image requests serve the original assets without transformations.
Configure a durable cache before adding ISR or on-demand revalidation.

## Before launch

The catalogue uses the owner’s handwritten product and pack-size lists plus the later wood-pressed confirmation: 20 products and eight bilingual categories, including separate ghee and paneer sections. Groundnut, Sesame and Coconut Oil are available as distinct cold-pressed and wood-pressed products, with separate IDs and the same listed prices and packs. Every product has an English and Tamil name. Existing prices and priced quantities are preserved without comparison prices or production costs. Additional pack prices are proportional to the base quantity and rounded up to whole rupees as requested. Ragi and Bajra have 500 g and 1 kg packs listed but remain unavailable until pack prices are confirmed. Product photos remain neutral placeholders; the Gemini category artworks and editorial photographs are illustrative, not actual Asal products or facilities. See `docs/catalogue.md` for pricing details and `docs/design-assets.md` for asset provenance.

Have the owner review Tamil terminology and provide the actual FSSAI certificate
and licence details before publishing a certification section.

Razorpay is integrated for sandbox testing. Live checkout remains gated: order storage is not configured, shipping/tax rules are unimplemented and inventory is not reserved. Test success does not place a fulfilment order or clear the bag. Complete the live-readiness checklist in `docs/payments.md` before collecting real money.

See [checkout integration notes](docs/checkout.md) and [design direction](docs/design.md).

## Search visibility

Public pages are indexable and publish route-specific titles, descriptions,
canonical URLs and share images. The homepage includes `WebSite` and
`Organization` structured data using the brand name Asal Iyarkai Angadi and its
alternate spelling Asaliyarkaiangadi. Cart and checkout remain `noindex`, and no
unverified product offers, ratings, addresses or certifications are published.

After the Git deployment is live, verify ownership in Google Search Console,
submit `https://asaliyarkaiangadi.in/sitemap.xml`, and request indexing of the
homepage. See [the indexing checklist](docs/seo.md) for validation and setup.
Code changes alone do not submit the site to Search Console or guarantee indexing.
