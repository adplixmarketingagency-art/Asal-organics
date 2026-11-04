# Asal Organics

A Next.js App Router storefront with a 17-product catalogue, product discovery, saved favourites, a persistent browser cart and pre-payment checkout review.

## Development

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
```

## Verification

```sh
npm test
npm run typecheck
npm run build
```

## Routes

- `/` and `/collections/wood-pressed-oils`: storefront
- `/cart`: bag quantities, removal and subtotal
- `/checkout`: delivery details and checkout review
- `POST /api/checkout`: validate details and recalculate catalogue pricing

## Cloudflare Workers deployment

This project uses the OpenNext Cloudflare adapter. Wrangler is installed locally;
the Worker name and account are configured in `wrangler.jsonc`.

```sh
npx wrangler whoami
npm run preview # Build and test in the local Workers runtime
npm run deploy  # Build and deploy asal-organics with its Custom Domain
```

The storefront is served at `https://asaliyarkaiangadi.in/` and
`https://asal-organics.adplixmarketingagency.workers.dev/`.
`wrangler.jsonc` attaches `asaliyarkaiangadi.in` as a Workers Custom Domain using
`custom_domain: true`. Cloudflare manages the apex DNS record and TLS certificate
for the Worker. The old Hostinger apex A record and wildcard Worker route have
been removed; the existing `www` CNAME is preserved.

For routing-only changes, run `npx wrangler triggers deploy` without rebuilding
or uploading another Worker version. The domain's nameservers are
`lewis.ns.cloudflare.com` and `mira.ns.cloudflare.com`; a resolver caching the old
Hostinger records can still display its parked page until that cache expires.

Only the generated Worker bundle and assets under `.open-next` are deployed.
Payments remain explicitly disabled; no payment credentials or database are
provisioned by deployment. If payments are activated later, use Wrangler secrets
for credentials and follow `docs/payments.md`.

No R2 cache or Cloudflare Images service is configured. The current site does not
use ISR, and image requests serve the original assets without transformations.
Configure a durable cache before adding ISR or on-demand revalidation.

## Before launch

The catalogue uses only the owner’s two handwritten product lists: 17 products across cold-pressed oils, masala flour, grain flour, milk products and traditional rice. Prices and quantities are transcribed without comparison prices or production costs. Ragi and Bajra quantities were not supplied, so both remain visible but cannot be added to a bag until confirmed. All old product and editorial food photographs have been removed; neutral image spaces are retained for merchant photography to be supplied later.

Razorpay will be integrated separately. There is no payment collection, order persistence, inventory reservation, shipping configuration or tax configuration yet. Checkout intentionally stops at review rather than claiming an order was placed.

See [checkout integration notes](docs/checkout.md) and [design direction](docs/design.md).
