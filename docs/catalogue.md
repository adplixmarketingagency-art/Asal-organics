# Catalogue categories and pack sizes

Transcribed from the owner's handwritten categorisation note, November 5, 2026.
The unrelated text above the horizontal rule is not catalogue data.

| Section | Pack sizes |
| --- | --- |
| Cold-pressed Oils · செக்கு எண்ணெய் | 500 ml, 1 Litre, 2 Litres, 5 Litres |
| Wood-pressed Oils · மரச்செக்கு எண்ணெய் | 500 ml, 1 Litre, 2 Litres, 5 Litres |
| Ghee · நெய் | 200 ml, 500 ml, 1 Litre |
| Masala & Spices · மசாலா வகைகள் | 100 g, 250 g, 500 g, 1 kg |
| Milk Products · பால் பொருட்கள் | 200 g, 500 g, 1 kg |
| Paneer · பனீர் | 200 g, 500 g, 1 kg |
| Traditional Rice · பாரம்பரிய அரிசி வகைகள் | 500 g, 1 kg |
| Ragi & Bajra · கேழ்வரகு & கம்பு | 500 g, 1 kg |

The note's “½ kg” is normalised to 500 g. “200, 500, 1 kg” for
milk products is interpreted as grams, consistent with the paneer row.
The masala sizes apply to all four masala products, not only turmeric.
Ghee and paneer are separate sections; the existing butter, palkova and halwa
remain under Milk Products.

## Pricing and product assignment

- Preserve the original 17 product IDs and existing selling prices. The owner
  additionally confirmed Groundnut, Sesame and Coconut Oil as wood-pressed
  products on November 5, 2026, bringing the catalogue to 20 products.
- Existing oils and ghee are priced for 1 Litre. Existing masala, other dairy
  and rice are priced for 1 kg.
- The owner subsequently authorised proportional pack pricing on November 5,
  2026, rounded **up** to a whole rupee. Calculate each pack once from the original
  price: `Math.ceil(basePrice * packMillilitresOrGrams / 1000)`.
  Do not derive one pack from another rounded pack or mix weight and volume.
- Cards and details offer selectable packs. For example, Groundnut Oil is
  ₹210 / 500 ml, ₹420 / 1 Litre, ₹840 / 2 Litres and ₹2,100 / 5 Litres.
  Curry Masala is ₹48 / 100 g, ₹120 / 250 g, ₹239 / 500 g and ₹478 / 1 kg.
  Filtering and sorting compare the original base-pack price, as labelled.
- Ragi's old ₹95 and Bajra's old ₹73 values do not identify a pack. Preserve
  them in the source for owner reconciliation, but do not advertise either
  as a 500 g or 1 kg price. The storefront displays **Price pending**.
- The owner's later screenshot request ("these same should be available as wood
  pressed") supersedes the initial unassigned wood-pressed category. Add separate
  `wood-groundnut`, `wood-sesame` and `wood-coconut` products; do not relabel or
  remove the original cold-pressed oils. English and Tamil names identify the
  wood-pressed method so bag and order summaries remain unambiguous.
- Use the same screenshot prices for the new wood-pressed products: ₹420,
  ₹560 and ₹420 per litre respectively, with the same four proportional packs.
  No wood-pressed premium is assumed. The owner can supply different prices later.
- Canonical variant IDs (such as `groundnut:500ml`) travel through cart, checkout
  validation and the existing order-items JSON snapshot. The server recalculates
  pack prices; it never trusts client prices, sizes or cross-product variant IDs.
  Different packs remain separate bag lines. Legacy bags without a variant retain
  their original base pack; an invalid explicit variant is rejected, not migrated.

## Owner follow-up

Confirm the base quantities for Ragi and Bajra.
Confirm the milk-products gram interpretation if a different unit was intended.
