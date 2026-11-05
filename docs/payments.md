# Razorpay Standard Checkout

Next.js App Router endpoints use the official Node SDK on the server and Razorpay's hosted Standard Checkout in the browser. No secret is sent to the client. Existing payment routes share the same implementation; no new database tables were added.

## Local sandbox

1. Use Node.js 22 or newer and run `npm ci`.
2. Copy `.env.example` to `.env` if a local file does not already exist. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `PAYMENT_MODE=test`, and `PAYMENTS_ENABLED=true` with your test credentials. `.env` is ignored by Git. Never use a public prefix for the secret.
3. `NEXT_PUBLIC_RAZORPAY_KEY_ID` may contain the public ID only. Checkout deliberately uses the key ID returned by the server, avoiding stale build-time keys.
4. Start `npm run dev -- --port 3101` and open `http://localhost:3101`.
5. Add a product with a confirmed unit, proceed through the bag, enter synthetic contact/address details, review, then choose **Pay with Razorpay · Test mode**.
6. Use Razorpay's documented sandbox payment methods. Configure automatic capture in the Razorpay dashboard; an `authorized` payment returns 409 until captured. Do not use real payment details.

Sandbox uses the items subtotal only; delivery and tax are not configured. Test checkout creates a real **test-mode Razorpay order**, but no merchant database order or fulfilment request. A signed, expiring server-issued reference binds the order ID, amount, currency and mode without storing customer information. Successful test verification keeps the bag unchanged.

## Endpoint contracts

All responses are `Cache-Control: no-store`. POST requests require JSON, at most 16 KiB, and same-origin requests when an Origin header is present.

- `GET /api/payments/config` → `{ enabled, mode }` only.
- `POST /api/create-order` (also `/api/payments/create-order`): accepts the existing checkout payload `{ items: [{ productId, quantity }], customer }`. See `docs/checkout.md` for the customer shape. Optional `amount` must be integer paise ≥100 and exactly match current catalogue pricing; optional `currency` must be `INR`. Client prices and receipts are not trusted.
- Create response: `{ order_id, amount, currency, key_id, orderToken, mode }`. The server generates the receipt and calls Razorpay's Orders API. No key secret is returned.
- `POST /api/verify-payment` (also `/api/payments/verify`): accepts `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, orderToken }`. Send all three callback fields **and** the unchanged token from create-order.
- Verification validates the signed reference (24-hour expiry), computes HMAC-SHA256 of the trusted server order ID + `|` + payment ID, and uses a timing-safe comparison. It also fetches the payment and requires matching order, amount, currency and `captured` status.
- Success response: `{ ok: true, mode, order_id, payment_id, orderPlaced }`. `orderPlaced` is false in sandbox.

Errors: malformed/missing fields, forged amount or mismatched signature → 400; bad customer/bag → 422; provider authentication → 401; provider/service errors → 500; disabled payments → 503; uncaptured payment or order-state conflict → 409. A signature failure never marks an order paid.

The UI handles script failures, request timeouts, cancellation, `payment.failed`, duplicate clicks and verification retries. After an ambiguous verification failure, retry **verification**, not payment. Confirmation state is in memory; do not refresh or navigate away while pending. For a live payment interrupted by navigation, reconcile through webhooks/provider records.

## Verification

```sh
npm test
npm run typecheck
npm run build:cloudflare # local build only, does not deploy
```

Unit tests inject a fake provider and existing order-store adapter. They cover amount tampering, missing units, malformed requests, signatures, token tampering/expiry, provider errors, capture checks and live order-state conflicts. They do not charge money or require a database. Complete one successful sandbox payment manually to verify the provider callback end to end; also test dismissal, failure, failed-verification retry, and edits in another tab.

## Before accepting real payments

Live mode remains fail-closed unless **all** of these are configured: `PAYMENTS_ENABLED=true`, `PAYMENT_MODE=live`, matching live keys, `CATALOGUE_APPROVED=true`, `PURCHASE_TOTAL_APPROVED=true`, `DATABASE_URL` and `RAZORPAY_WEBHOOK_SECRET`.

The flags are not substitutes for implementation. Before enabling them:

- Confirm missing Ragi/Bajra units, inventory, delivery eligibility, shipping/tax calculation and the final payable total. Current creation charges only the catalogue subtotal; implement any applicable extra charges on the server and display them in the review.
- Configure the project's existing Postgres order store. Live creation saves the immutable pending snapshot before contacting Razorpay and attaches the returned provider order. Verification uses that snapshot, not current browser data. No database is configured by this task.
- Add server-side rate limiting, durable create-order idempotency, inventory handling and reconciliation for interrupted/expired checkouts. The current UI prevents double clicks, not repeated requests from independent clients.
- Set a public HTTPS webhook at `/api/webhooks/razorpay` for `payment.captured`, with a separate webhook secret. It is disabled in sandbox. Live events validate the raw-body signature, fetch the provider payment and compare its amount/order/currency. Payment updates and the existing notification-outbox insertion are transactionally idempotent; failed processing is retryable.
- Configure automatic capture and complete Razorpay business activation, required store policies and support details.
- Rotate any credentials shared in chat. Do not commit `.env`, `.dev.vars`, secret configuration or logs.

## Cloudflare deployment

`wrangler.jsonc` enables **test mode only** and retains the existing **Custom Domain** at `https://asaliyarkaiangadi.in`. Configure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` as Worker secrets, then run `npm run deploy`. Local `.env` does not provision deployed secrets. To set or rotate them interactively without placing values in shell history:

```sh
npx wrangler secret put RAZORPAY_KEY_ID
npx wrangler secret put RAZORPAY_KEY_SECRET
npm run deploy
```

The deployment script builds an isolated, temporary source copy using `npm ci`; it excludes local environment files, credentials and previously generated artifacts. It verifies that OpenNext's compiled environment contains no local values before uploading, preserves Worker secrets, and removes the temporary copy afterward. Use Node.js 22 or newer. Runtime `key_id` comes from the create-order response, so no public key needs to be compiled into the browser bundle.

After deployment, `GET /api/payments/config` should return `{"enabled":true,"mode":"test"}`. Add a product and complete the sandbox test steps above on the deployed domain. Set `PAYMENTS_ENABLED=false` in `wrangler.jsonc` and redeploy to disable checkout. Never switch to live keys until the launch checklist is complete.

**Build precaution:** Next standalone builds copy `.env` into server output, and OpenNext compiles `.env*` values into its server-side `cloudflare/next-env.mjs`. These are not browser assets, but they must not be used to ship local credentials. `npm run deploy` handles this isolation. Do not manually upload local `.next` or `.open-next` artifacts from development or preview builds.

## Seller notifications

The existing order store inserts one `seller_order_paid` notification-outbox row on the first successful paid transition. An email/WhatsApp sender, seller dashboard and retry worker are not implemented. No seller notification is sent yet. Fulfilment and notifications must rely on verified server records, never the browser success screen.

Reference: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
