# Oil GST and delivery — 17 November 2026

## Verified rate and scope

Indian edible groundnut, sesame and coconut oils attract total GST of **5%**:
2.5% CGST plus 2.5% SGST/UTGST for an intra-state supply, or 5% IGST for an
inter-state supply. Pressing by wood or cold press does not itself change these
headings, for the listed edible, non-chemically-modified oils.

Primary reference: [Gazette notification No. 9/2025–Central Tax (Rate),
17 September 2025](https://egazette.gov.in/WriteReadData/2025/266209.pdf),
effective 22 September 2025. English Schedule I (2.5% central component), p76;
entries 85 (1508, groundnut), 90 (1513, coconut), 92 (1515, other fixed vegetable
oils including sesame), p80. The [CBIC rate table](https://cbic-gst.gov.in/hindi/gst-goods-services-rates.html)
corroborates these rates but is labelled as at April 2023; it is not used alone
as the current-law authority. The October 2026 GST Council press release reviewed
did not identify a change to these oils; recommendations alone are not law.

Only these six product IDs are configured. All other food classifications and
rates remain **pending**, not assumed exempt or automatically taxed at 5%.

## Customer calculation

The owner corrected the pricing basis on 17 November: **listed prices already
include GST**. No oil GST is added at checkout. Packs retain their original
whole-rupee selling prices. The included oil GST component is extracted per line
as `gross × 5 / 105`, rounded to the nearest paise, for internal order records
only; it is not a surcharge or a separate customer checkout line.

Delivery is **₹49 once per nonempty order**, inclusive of applicable delivery GST.
For an oil-only parcel, ₹2.33 of the ₹49 is included delivery GST; it is disclosed
but not added again. This treats seller-arranged delivery as incidental to the
goods. CGST Act [section 15(2)(c)](https://gstcouncil.gov.in/sites/default/files/2024-04/annexure-3_cgst-act_2017.pdf),
p18, includes supplier charges for anything done at/before delivery in the value
of supply. Courier invoicing/composite-supply treatment must be confirmed for the
actual business; mixed-cart delivery tax is not guessed.

Example: ₹420 oil (₹20 GST already included) + ₹49 delivery = **₹469**.
Mixed/non-oil carts use the same GST-inclusive selling prices plus delivery.
Their rates/classifications remain unverified, so the total is marked estimated;
no extra tax is guessed. The sandbox can test that estimate; live mixed/non-oil creation fails
before the provider or order store is contacted.

## Safety and persistence

- `getCheckoutPricing()` feeds cart display, checkout review and server creation.
  Optional browser amounts must equal the full server total; browser charges,
  prices and receipts cannot override it.
- Stored orders and signed payment references use the full total. Nullable
  `pricing` stores the original breakdown; legacy rows remain null. New snapshots
  are version 2 with `priceIncludesGst: true`. Version 1 snapshots from the
  previous additive calculation are preserved and labelled correctly in admin;
  existing order/payment amounts are never silently rewritten.
- D1 requires additive migration `0002_order_pricing.sql`; PostgreSQL adds the
  nullable JSONB column under its existing migration lock.
- The authenticated dashboard shows the persisted tax/delivery breakdown; owner
  notifications already use the stored full amount.
- Images, base prices, packs, owner credentials and existing live approvals are
  unchanged. Complete-label review still blocks live checkout.
- GST registration must be verified before real collection. Section 32(1) of
  the CGST Act (p30) prohibits an unregistered person collecting amounts as GST.
  Do not invent a GSTIN, assume a seller state, generate a tax invoice or enable
  live approvals from this rate lookup alone.

## Validation

Automated tests cover all six oils/packs, quantities, empty and mixed bags,
paise formatting, tampered browser totals, provider/signature amounts, D1
pricing persistence and legacy-null rows. Optional PostgreSQL integration
requires a disposable configured database. No real payment or email is sent
by these tests.

Graphify CLI is unavailable; saved graph relationships were checked against
the actual pricing, checkout and order-store sources.

The original additive release passed 151 runnable tests and independent review.
It is superseded by the owner's GST-inclusive correction and warning-copy cleanup.
The corrected acceptance check is ₹420 + ₹49 = ₹469, with no added GST line.
No payment was submitted. PostgreSQL legacy-null integration remains
unexercised locally; D1 legacy rows were checked. The admin displays the saved
delivery charge but does not separately repeat its included GST component.

GST-inclusive correction: 152 runnable tests passed, one optional PostgreSQL
test skipped, typecheck passed. Desktop and 390px mobile checkout showed ₹420
items + ₹49 delivery = ₹469, with no separate GST surcharge or horizontal
overflow. Product popup/detail checks confirmed the requested warning blocks
were removed while the full-detail link, bag/favourite actions and GST-inclusive
price note remained.
