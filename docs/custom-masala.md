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

The customiser collects **ingredients only**, never name, phone or address.
**Continue to checkout** opens `/checkout?custom=masala`, using the same
`checkoutDetails` state and contact/address fields as regular checkout. A
previously entered checkout address is reused; custom checkout also works when
the regular bag is empty. Regular cart items and the ₹49 regular-order delivery
charge are unchanged.

**Save custom request** sends the recipe quantities/note, validated checkout
customer/address and an idempotency UUID to `/api/custom-masala`. A successful
save reveals the WhatsApp link, with the
immutable server recipe and request reference, to **+91 7305597782**. The customer
reviews and sends the draft; saving does not send a message or initiate payment.
Items added only in WhatsApp cannot automatically sync to the dashboard.

A failed save preserves inputs and does not reveal a successful saved state.
Retries reuse the UUID for the same canonical recipe/customer; changed recipes
or addresses use a new UUID. Request identity and saved results live in provider
memory, so navigating back to the recipe and returning retains the saved
reference instead of creating another admin entry. Reset clears the recipe and
note atomically. Refreshing loses this in-memory draft and presents a helpful
customiser link instead of an empty checkout.
Saving is an unpaid enquiry, **not** a paid order, reservation or delivery promise.
Checkout requires customer name, mobile number and full Indian delivery address
before saving. Email and apartment/landmark are optional for custom requests.
These details are stored privately with the recipe and shown when admin opens
the CUSTOM entry. The WhatsApp draft contains the recipe/reference, not the
customer's address. Customer data is never put in localStorage or public links.
Older enquiries without contact details show an explicit missing-address note.

## Admin and storage

- Existing admin Order inbox lists custom requests with **CUSTOM / Unpaid
  request**; the Custom requests filter excludes regular orders.
- Details show every selected ingredient, grams, rate and line cost; aggregate
  listed quantity, ingredient cost, grinding, calculated subtotal and note,
  plus the customer's name, phone, address, city, state and PIN code.
- Custom requests cannot attach Razorpay orders, be marked paid by the standard
  payment adapter, or use standard fulfilment transitions.
- In-page/opt-in browser alerts notice newly seen custom requests while the
  dashboard is open. Paid-order email processing remains unchanged; no new email
  service or closed-browser push is claimed.
- D1 migration `0003_custom_masala_requests.sql` adds default-standard
  `order_kind`, nullable JSON `custom_recipe` and separate request-rate limits.
  PostgreSQL creates equivalent fields under its existing schema lock.
- The public endpoint checks the fixed production Origin, JSON type, 16 KiB body,
  known ingredients, valid quantities, UUID, a 1,000-character note and validated
  customer/address. All rates
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

Desktop/mobile checks confirmed an ingredient-only popup, 300 g / ₹101,
checkout address reuse, optional custom email, empty-bag custom checkout,
missing-address validation, saved Other ingredients note and request reference,
CUSTOM badge and every ingredient plus the exact checkout address in admin.
At 390 × 844, both popup and checkout had no horizontal overflow. Regular
checkout review retained ₹420 GST-inclusive oil + ₹49 delivery = ₹469.
Navigating back and changing 100 g to the equivalent 100.0 g retained the saved
request/reference with no second save button. Refreshing safely showed the
missing-recipe state. Final suite: 179 tests, 177 passing, two optional PostgreSQL
tests skipped, zero failures; TypeScript and `git diff --check` passed.

Graphify CLI was unavailable; saved graph relationships were read and checked
against sources. `graphify update .` could not run. Existing Next.js 16.4.3
security advisory was noted separately; this feature does not upgrade dependencies.
