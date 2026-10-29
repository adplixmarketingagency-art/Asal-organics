# Asal Organics

A Next.js App Router storefront with an oil catalogue, product discovery, saved favourites, a persistent browser cart and pre-payment checkout review.

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

## Before launch

This remains a reference-catalogue preview. Product imagery and indicative prices are attributed to Aishwaryam Oils and must be replaced with licensed merchant-owned content.

Razorpay will be integrated separately. There is no payment collection, order persistence, inventory reservation, shipping configuration or tax configuration yet. Checkout intentionally stops at review rather than claiming an order was placed.

See [checkout integration notes](docs/checkout.md) and [design direction](docs/design.md).
