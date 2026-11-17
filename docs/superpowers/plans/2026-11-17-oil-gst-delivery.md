# Oil GST and Delivery Implementation Plan

**Historical plan:** The owner later corrected listed prices to GST-inclusive.
The implemented correction uses subtotal + ₹49 only, with version 2 snapshots.
The previous additive tests/steps below are superseded by current tests and
`docs/oil-gst-delivery.md`.

> **For agentic workers:** Use superpowers:executing-plans inline. Steps use checkbox syntax.

**Goal:** Add 5% GST on listed edible-oil prices and ₹49 delivery once per order.
**Architecture:** Shared pure integer-paise calculation; server-authoritative
payment total; immutable nullable pricing snapshot in existing order stores.
**Tech Stack:** Existing Next.js, React, Node tests, D1/PostgreSQL and Cloudflare.
**Spec:** `docs/superpowers/specs/2026-11-17-oil-gst-delivery-design.md`

## Global constraints

No image, catalogue-price, credential or live-approval changes. Delivery ₹49
includes applicable delivery GST. Non-oil tax remains unverified, not zero-rated.
No real checkout transactions. Stage only task files.

## Review focus

- Mixed carts must not become 5%-taxed wholesale or claim other items exempt.
- Delivery is once per order and absent for empty bags.
- Paise shown, signed, charged and persisted must match.
- Review/payment recalculation must ignore forged browser fees.
- Legacy orders must keep original totals and lack invented breakdowns.

### Task 1: Pricing and payment calculation

**Files:** `src/lib/checkout-pricing.ts`, `src/lib/checkout.ts`,
`src/lib/payment-handlers.ts`, `tests/checkout-pricing.test.mjs`,
`tests/checkout.test.mjs`, `tests/payments.test.mjs`.
**Interface:** `getCheckoutPricing(summary: CartSummary): CheckoutPricing`,
`formatMoneyPaise(amountPaise: number): string`.

- [ ] Write assertions: 42000 + 2100 + 4900 = 49000; oil delivery GST 233
  included; all six oils; quantities/packs; mixed pending tax; empty zero;
  fractional-paise rounding and exact currency formatting.
- [ ] Run focused Node tests and observe new expectations fail.
- [ ] Implement shared pricing, attach it to review, charge/sign its total.
- [ ] Update payment tests to full totals and test forged fees/subtotal amounts.
- [ ] Run pricing, checkout and payment tests; all must pass.

### Task 2: Storage and customer/admin display

**Files:** Existing order adapters, admin types/details, nullable pricing migration,
commerce/product components, copy tests, D1/PostgreSQL tests and commerce docs.
**Interface:** `CheckoutReview.pricing`; nullable `AdminOrderDetail.pricing`.

- [ ] Add failing D1 assertions for amount 122500, pricing snapshot and legacy null.
- [ ] Persist pricing in both stores; apply the additive schema locally.
- [ ] Render shared or saved breakdowns, oil tax notes and ₹49 delivery guidance.
- [ ] Update stale subtotal-only/unconfigured copy without altering label gates.
- [ ] Run complete tests, typecheck and diff checks; review all changes.

### Task 3: Verify and publish

- [ ] Desktop/mobile browser check: oil subtotal, 5% GST, ₹49, exact total;
  review endpoint agrees; no payment submission. Save screenshots.
- [ ] Fresh review of pricing, legacy storage and payment safety.
- [ ] Update Graphify if available; otherwise document limitation.
- [ ] Commit task files, integrate without overwriting unrelated changes, apply
  additive D1 migration, isolated Cloudflare build/deploy and normal Git push.
- [ ] Verify deployed UI/API and matching local/remote commit; report caveats.
