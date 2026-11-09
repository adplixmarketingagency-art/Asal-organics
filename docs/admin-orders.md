# Owner desk and notifications

Open `https://asaliyarkaiangadi.in/admin/orders`.

The owner desk shows real stored live orders, payment references, customer delivery details, immutable item/price snapshots, and a separate fulfilment lifecycle: **To pack → Packed → Shipped → Delivered**. Only paid orders can advance. Every change records the verified owner's email and timestamp. Conflicting updates return 409; no payment/refund state can be edited here.

**Deployment alone does not connect the services.** The current store remains in sandbox mode, which deliberately does not save orders or send notifications. Do not change payment approval flags just to test this dashboard.

## 1. Owner sign-in

Production uses the owner's selected email/password login. The email is a login identifier; deploying this app does **not** create an email mailbox. No public registration or password-reset-by-email flow is exposed.

Store `ADMIN_LOGIN_EMAIL` and `ADMIN_PASSWORD_HASH` as runtime Worker secrets, never in Git or build-time variables. Use `scripts/set-owner-password.mjs <owner-email>` with the password on **stdin**, not a shell argument. It generates a random 16-byte salt and scrypt hash (N=32768, r=8, p=3), then uploads only the email and hash with Wrangler. Do not enter passwords in shell history or CI logs.

- Every page/API data request independently checks a random 256-bit session token against D1. Only its SHA-256 hash is stored in the database.
- Cookies are `__Host-`, HttpOnly, Secure, SameSite=Strict, host-only and expire after 8 hours. No token is stored in browser JavaScript storage.
- Logout is CSRF-protected POST and revokes the server-side session. Credential/email rotation invalidates existing sessions on their next request.
- Sign-in uses generic errors, bounded request bodies, exact-origin checks and persistent D1 counters: 10 requests/IP/15-minute fixed window plus 60 globally. IP addresses are hashed; expired counters are removed. A fixed-window boundary can permit two consecutive buckets. Missing database/configuration fails closed.
- Prefer a unique password stored in a password manager. Rotate any password shared in chat before broader rollout. There is no MFA in the password flow.

Cloudflare Access JWT verification remains an optional alternative when password login is not configured. Set `ADMIN_ACCESS_TEAM_DOMAIN`, `ADMIN_ACCESS_AUD`, and `ADMIN_EMAILS`, and protect both `/admin` and `/api/admin` and all descendants. Password mode never accepts Access as an authentication bypass.

## 2. Cloudflare order storage

Production uses dedicated Cloudflare D1 database `asal-orders`, binding `ASAL_DB`, with `ORDER_STORAGE=d1`. No unrelated database is reused. Apply migrations before deploying code:

```sh
npx wrangler d1 migrations apply asal-orders --remote
```

D1 triggers atomically write payment notification outbox entries and fulfilment audit records with the corresponding order update. Prepared statements bind input values; primary-first sessions avoid stale authentication/order reads. Customer information stays in the private database and authenticated responses. Configure backups/retention appropriate to the business; D1 Time Travel availability depends on the account plan.

PostgreSQL remains supported outside this deployment: unset `ORDER_STORAGE` and configure `DATABASE_URL` using a secure provider TLS URL. Its schema migrates idempotently with an advisory lock; each operation opens/closes its own invocation-scoped connection. Never use production storage in automated integration tests.

## 3. Configure owner email

The existing project's `RESEND_API_KEY` integration now sends paid-order alerts.

1. Verify an **owned** sender domain in Resend.
2. Choose the authorised owner's recipient address.
3. Set:

```sh
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put SELLER_ORDER_EMAIL
npx wrangler secret put SELLER_ORDER_FROM_EMAIL
npx wrangler secret put NOTIFICATION_CRON_SECRET
```

Use plain addresses for `SELLER_ORDER_EMAIL` and `SELLER_ORDER_FROM_EMAIL`; no display-name syntax. Generate the cron secret with a cryptographically secure password generator (at least 32 characters). Never put secrets in a `NEXT_PUBLIC_` variable, Git, logs, or chat.

`worker.js` extends OpenNext with a five-minute scheduled handler. It internally calls the authenticated processor using the same runtime bindings/secrets. No external scheduler is required. Confirm the cron trigger in Workers → Triggers and monitor failures. Deployment copies `worker.js` in the isolated deploy script. If using CI, runtime secrets must not be injected into the build environment.

The owner can also choose **Process queue** or **Queue safe retry**. Notifications include receipt, paid amount and a secure dashboard link; customer name, phone, address and items stay in the protected dashboard.

### Delivery guarantees and limits

- One durable outbox row is inserted transactionally on the first verified paid transition. Duplicate webhooks don't create duplicate alerts.
- D1 atomic conditional updates (or PostgreSQL `FOR UPDATE SKIP LOCKED`) and two-minute leases prevent concurrent workers from taking the same job.
- Processing takes at most five jobs per run. Monitor backlog; increase scheduling capacity separately if volume grows.
- Each email uses a stable provider idempotency key and a frozen payload/recipient, even when configuration changes later. Never edit the stored payload to redirect a retry. Jobs are bound to the destination configured at their first attempt.
- Failed deliveries retry with exponential delay, up to six attempts. Provider acceptance is labelled **Provider accepted**: this is not proof of delivery to the inbox. Check Resend for bounce/spam outcomes.
- Resend deduplicates for only 24 hours. Automatic and manual retries stop after 22 hours from the first attempt. Old ambiguous jobs become **Check provider**; inspect provider history before arranging any new email. The dashboard intentionally does not offer unsafe “resend anyway”.
- Missing configuration leaves the queue pending, rather than reporting success. Notification failures never roll back payment confirmation.
- Browser alerts are opt-in, with no customer data in the alert. Polling refreshes visible tabs every 30 seconds and when returning to the page. It is **not** background push when the tab/browser is closed. Use email for that case. No WhatsApp delivery is included.

## API

All customer/order endpoints independently authenticate and return `private, no-store`.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/admin/login` | Email/password login; rate-limited and CSRF-protected |
| `POST /api/admin/logout` | Revoke current session and clear cookie |
| `GET /api/admin/orders?status=all&page=1&q=receipt` | 20 orders/page, bounded search by receipt or customer name, global counts and notification setup state |
| `GET /api/admin/orders/:id` | Full customer, items, payment, notification and fulfilment history |
| `PATCH /api/admin/orders/:id` | `{ "from": "unfulfilled", "to": "packed" }` (next state only) |
| `POST /api/admin/orders/:id/retry` | `{}`; queue an eligible notification retry |
| `POST /api/admin/notifications/process` | `{}`; process up to five ready notifications |
| `POST /api/internal/notifications` | Cron only; `Authorization: Bearer <NOTIFICATION_CRON_SECRET>` |

Admin mutations require JSON, exact production Origin `https://asaliyarkaiangadi.in` and `X-Asal-Admin: 1`. They reject cross-origin/oversized bodies. Search/filtering never touches SQL syntax. API errors do not expose credentials, query text or provider response bodies.

## Phone home-screen app

The owner desk is an installable, online-only web app with a dedicated icon, standalone window and phone-friendly order cards. Its manifest starts at `/admin/orders` (never a customer-specific deep link) and is scoped to `/admin/`.

- **iPhone/iPad:** open the owner desk in Safari → Share → Add to Home Screen → Add. Keep “Open as Web App” enabled if offered.
- **Android:** open it in Chrome → ⋮ → Add to Home screen / Install app. The dashboard also offers the native install prompt when Chrome makes it available.
- The app still requires owner login and internet. No service worker, offline customer-data cache or payment interception is introduced. Login is held only in a secure HttpOnly session cookie.
- Installation does not enable background push. Foreground browser notifications depend on browser support; owner email alerts are the reliable closed-app channel once configured.
- Keep `/owner-app.webmanifest` and `/icons/owner-*.png` publicly readable over HTTPS, outside the protected paths. These contain only public branding, not order data. The protected start URL must still require login.
- Verify installation/login on an actual iPhone and Android before rollout; desktop device emulation does not prove an OS home-screen install.

## Verification

```sh
npm test
npm run typecheck
npm run build:cloudflare
# Optional real PostgreSQL integration test; DISPOSABLE DATABASE ONLY:
ADMIN_TEST_DATABASE_URL='postgresql://...' npm test
```

The isolated PostgreSQL and D1/Miniflare database tests use synthetic data and intercepts email HTTP calls (no real deliveries). It exercises JSONB storage, duplicate captured payments, concurrent status updates, concurrent outbox claiming, lease recovery, frozen idempotent messages and expiry. It removes its own records afterward; use an empty test database because the processor claims pending rows globally.

Before launch, verify password login/logout with the owner, deny wrong credentials, check nested APIs unauthenticated, run a controlled authorised email test, and inspect cron/provider logs. Follow all payment launch prerequisites in [payments.md](payments.md); the dashboard is not permission to enable live sales.
