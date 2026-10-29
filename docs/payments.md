# Razorpay payments and seller notifications

The application contains a server-only Razorpay adapter, order snapshot tables, payment verification, and a raw-body webhook endpoint. **Payments remain disabled by default.** A missing key, webhook secret, or database URL keeps payment creation at `503`.

## Activation checklist

1. Replace the public reference catalogue with Asal-owned products, prices, stock, images, delivery rules, and tax rules. The current subtotal is not a launch total.
2. Provision managed Postgres (Neon is the recommended Vercel Marketplace storage option) and set `DATABASE_URL`. Do not use local JSON or memory for orders.
3. Create Razorpay Test Mode keys. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and a separate random `RAZORPAY_WEBHOOK_SECRET` as server-only secrets.
4. Set `PAYMENTS_ENABLED=true` only after catalogue and totals are approved. Only the public key reaches the browser.
5. Configure a public HTTPS Razorpay webhook at `/api/webhooks/razorpay`, subscribe to `payment.captured`, and copy its secret into the environment. Razorpay cannot configure this from code.
6. Test in Test Mode, then switch to Live keys only after business verification and HTTPS deployment.

## Seller notification system plan

After independent capture verification, the database transaction marks the immutable order snapshot `paid` and inserts one `seller_order_paid` row in `asal_notification_outbox`. Duplicate browser confirmations and webhook deliveries do not create duplicate notifications.

Recommended worker flow:

1. A protected cron/worker claims pending rows with a short lease (`FOR UPDATE SKIP LOCKED`) and sends a compact seller email: order number, paid time, customer name, phone, delivery address, line items, quantity, amount, Razorpay payment ID, and an authenticated seller-order link. Never include card, UPI, or secret credentials.
2. Choose an email provider (Resend/Postmark/SES) before enabling delivery. Store provider message IDs, retry transient failures with exponential backoff, and surface permanent failures to an operator queue.
3. Add an authenticated, role-protected seller dashboard. An unguessable order ID is not authorization; mask customer data by default and audit access to full address/phone.
4. Add WhatsApp/SMS/push later through the same outbox with consent, templates, rate limits, and delivery status. Email is the durable baseline.
5. Reconcile webhook/provider state on a schedule; late events must never downgrade `paid`. Fulfilment and notifications must key off server state, not browser success.

Email is intentionally not sent yet: no seller address or messaging provider was selected. Remaining work is the outbox worker, seller auth/dashboard, provider adapter, lease/retry columns, and duplicate/out-of-order tests.
