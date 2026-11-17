# Oil GST and delivery

**Superseded pricing basis:** The owner subsequently confirmed listed prices
already include GST. Current calculation is subtotal + ₹49 delivery only.
Included oil GST is extracted as `gross × 5 / 105`, not added. See
`docs/oil-gst-delivery.md`; the original approved proposal below is historical.

## Intent and approach

The owner requested the Indian oil tax rate and ₹49 delivery at checkout,
then accepted the proposal to add 5% GST on top of listed oil prices.
Keep base catalogue prices, packs, navigation and all images unchanged.

Use one integer-paise pricing function for the bag, checkout review, server
payment creation and immutable order snapshot. A UI-only surcharge would leave
Razorpay charging the old subtotal; changing base prices would obscure the tax.

## Calculation and display

- The six edible groundnut, sesame and coconut oils (both pressing methods)
  receive 5% GST on their listed line totals.
- Delivery costs ₹49 once per nonempty order, not per item, litre or line.
- ₹49 is the final delivery charge, inclusive of applicable delivery GST.
  For an oil-only order its included 5% GST is ₹2.33; do not add it again.
- Example: ₹420 oil + ₹21 oil GST + ₹49 delivery = ₹490.
- Display currency without rounding away paise. Do not charge for an empty bag.
- Do not assume non-oil products are 5% or zero-rated. Their unverified tax
  status remains explicit; mixed/non-oil totals are estimates.
- Keep all existing live-sale, label-review and payment-approval gates.
  Merchant GST registration, place of supply, other classifications and delivery
  eligibility still require review before live collection.

## Persistence and verification

Save the pricing breakdown in a nullable JSON column, preserving old orders
without reconstructing their charges from today's rates. Show the saved breakdown
in the admin details; owner email already uses the persisted full amount.
Test all oils, packs, quantities, empty/mixed bags, amount tampering, exact paise,
both order stores and legacy orders. Check mobile and desktop UI without
submitting real payments or orders. Publish through the existing Cloudflare
workflow and push only task files; preserve unrelated graph changes.
