# Custom masala card and admin requests

The owner approved a normal-sized first card in Masala & Spices, distinguished
by its border/tint. Opening it reveals optional gram inputs for the 15 supplied
ingredient variants. Prices use the supplied per-100g rates; grinding is ₹30/kg
proportionally. No GST is added again. Existing images/products/prices remain.

The owner also approved saving a recipe as an **unpaid custom request** before
opening a WhatsApp draft to +91 7305597782. An optional Other ingredients note
is saved and included in that draft. WhatsApp-only edits cannot sync back.
The menu first saves, then provides an explicit Open WhatsApp link; it never
sends a message, collects payment, reserves stock or claims fulfilment.

Use the existing durable order database with additive `order_kind` and
`custom_recipe` fields. Default kind remains standard. Custom requests use
pending/unpaid status, a CUSTOM badge and their own admin filter. Details show
all selected ingredients, grams, rates, line costs, aggregate weight, grinding,
calculated subtotal and note. Delivery/other-item charges remain unquoted.
The owner subsequently required complete contact/address on the custom entry:
name, valid Indian mobile, street, city, state and PIN are required at save.
Email and landmark are optional. Admin shows all these details alongside the
recipe; older entries without addresses are explicitly identified. The draft
contains only recipe/reference, not private contact/address. The request stays
unpaid, distinct from a confirmed delivery order.

The public endpoint validates a bounded JSON body, fixed same-origin requests,
known ingredient IDs, decimal/range limits and note length. All rates/totals are
recomputed server-side. Durable hashed-IP/global rate limits and a UUID
idempotency key prevent uncontrolled/repeated inserts. Failed saves do not
open WhatsApp or claim success. A changed recipe needs a new saved snapshot.
Existing paid-order notifications and live-sale gates remain unchanged.

Tests: calculation, validation/tampering, idempotency, same-origin/body limits,
rate limits, SQLite persistence/admin list/detail, custom payment/fulfilment
blocks, legacy standard rows. Browser: equal-sized first card, popup keyboard
close, edit/reset, total calculation, save failure/retry, mobile scrolling and
draft content. No production test requests, real payments or messages.
