# Customised masala — 19 November 2026

## Storefront

The first tile in Masala & Spices is a normal-sized **Customised Masala** card,
with a gold border and warm tinted background. Its ingredient menu opens in the
existing accessible modal; it is not a full-width inline form or gallery.
The card stays first in grid and list views. All existing images and ready-made
products remain unchanged.

Rates per 100 g: coriander seeds ₹22; long chilli ₹35; round chilli ₹50;
Kashmiri chilli ₹55; turmeric ₹30; toor dal ₹17; channa dal ₹15; cumin ₹70;
fennel ₹48; fenugreek ₹30; dry ginger ₹80; mustard ₹20; curry leaves ₹10;
asafetida ₹120; raw rice ₹10.

Quantities are optional in grams, to one decimal place, 0–10,000 per ingredient.
Blank/zero quantities are omitted. Rates are computed in paise, rounding each
ingredient line and the grinding charge to the nearest paise. Grinding is
**₹30/kg proportionally**, not rounded up to the next kilogram. GST is not added
again. Example: 100 g coriander + 200 g long chilli = 300 g, ₹92 ingredients +
₹9 grinding = **₹101**. Other-item quantities/prices and delivery are not
included in the listed-ingredient calculation.

## Saved request and WhatsApp

The optional **Other ingredients** note captures unlisted ingredients and
instructions for admin. At least one positive listed quantity or a nonempty note
is needed to save; individual quantities are never required.

**Save request** sends only the recipe quantities/note and an idempotency UUID
to `/api/custom-masala`. A successful save reveals the WhatsApp link, with the
immutable server recipe and request reference, to **+91 7305597782**. The customer
reviews and sends the draft; saving does not send a message or initiate payment.
Items added only in WhatsApp cannot automatically sync to the dashboard.

A failed save preserves inputs and does not reveal a successful saved state.
Retries reuse the UUID for the same draft; changed recipes use a new UUID.
Saving is an unpaid enquiry, **not** a paid order, reservation or delivery promise.
No customer contact/address is demanded or fabricated for the enquiry.

## Admin and storage

- Existing admin Order inbox lists custom requests with **CUSTOM / Unpaid
  request**; the Custom requests filter excludes regular orders.
- Details show every selected ingredient, grams, rate and line cost; aggregate
  listed quantity, ingredient cost, grinding, calculated subtotal and note.
- Custom requests cannot attach Razorpay orders, be marked paid by the standard
  payment adapter, or use standard fulfilment transitions.
- In-page/opt-in browser alerts notice newly seen custom requests while the
  dashboard is open. Paid-order email processing remains unchanged; no new email
  service or closed-browser push is claimed.
- D1 migration `0003_custom_masala_requests.sql` adds default-standard
  `order_kind`, nullable JSON `custom_recipe` and separate request-rate limits.
  PostgreSQL creates equivalent fields under its existing schema lock.
- The public endpoint checks the fixed production Origin, JSON type, 16 KiB body,
  known ingredients, valid quantities, UUID and a 1,000-character note. All rates
  and totals are recomputed server-side. Limits are 5 per hashed IP and 100
  globally per 15-minute bucket; rejected IP requests do not consume global
  capacity. Admin access remains authenticated and responses stay no-store.

## Verification

Unit/SQLite tests cover owner prices, blank/invalid quantities, rounding,
server-money recomputation, HTTP guards, rate limits, idempotency/conflicting
replays, immutable admin recipe display, legacy standard orders and blocked
custom payments. Optional PostgreSQL integration requires a disposable test
database. Browser QA used synthetic **local** recipes and an ephemeral local
admin session; the session cookie was removed afterward. No production test
recipe, payment or WhatsApp message was submitted.

Desktop/mobile checks confirmed equal-sized highlighted cards, popup scrolling,
300 g / ₹101, saved Other ingredients note and request reference, CUSTOM badge
and all recipe details with no mobile horizontal overflow.

Graphify CLI was unavailable; saved graph relationships were read and checked
against sources. `graphify update .` could not run. Existing Next.js 16.4.3
security advisory was noted separately; this feature does not upgrade dependencies.
