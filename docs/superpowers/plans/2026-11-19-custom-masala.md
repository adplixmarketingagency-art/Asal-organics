# Custom Masala Implementation Plan

> Use superpowers:executing-plans in this session, with test-driven checks.

**Goal:** A highlighted standard-size masala card with recipe pricing and durable
unpaid custom enquiries visible in admin.
**Architecture:** Existing modal and pure pricing helper; new bounded public
request handler saves a server-calculated snapshot in the existing order store.
Existing admin list/details add custom-specific display and filtering.
**Spec:** `docs/superpowers/specs/2026-11-19-custom-masala.md`

## Constraints

Preserve all images, prices, regular checkout, payment approvals and credentials.
No automatic WhatsApp send or claim of payment. No production test insertions.

## Tasks

1. [x] Card/menu and pure calculation: owner rates, optional grams, ₹30/kg,
   validation, WhatsApp draft and equal-sized highlighted first-card UI.
2. [x] Add red tests for public request validation, deterministic snapshot,
   idempotency, bounded same-origin HTTP requests and save failures.
3. [x] Implement `prepareCustomMasalaRequest(value)`, request handler,
   D1/PostgreSQL durable rate limit/storage and additive migration.
4. [x] Extend D1 tests for immutable custom rows, list/filter/details, replay
   conflict, legacy rows and blocked payment/fulfilment.
5. [x] Add admin CUSTOM badges, filter and recipe detail component. Add notes
   and explicit save-then-open flow to the menu, retaining recipe state on close.
6. [x] Run full tests/typecheck, desktop/mobile browser checks and independent
   review; fix blockers, then migrate/deploy via existing Cloudflare workflow
   and push only these task files.

Review fixes: rejected IP attempts no longer consume global capacity; WhatsApp and
menu totals use the saved server snapshot. Added optional PostgreSQL custom tests.
Release migration, isolated Cloudflare deployment and Git push completed.

Owner follow-up: collect validated name/mobile and complete Indian address in
the custom menu; store/compare customer with immutable recipe; show contact and
address when opening the CUSTOM admin entry. Preserve old enquiries without
inventing address details. Email and landmark remain optional.

Final verification: 174 runnable tests passed, two optional PostgreSQL tests
skipped, typecheck passed. Local synthetic admin view confirmed full address
and ingredient details on mobile/desktop; live menu and invalid-request guards
verified without a production test insertion. Worker version
`87070c0b-21c3-4b02-814e-2628a760de8c`.
