# Food label and storefront review

Reviewed 12 November 2026 against the owner-supplied **Food Safety and Standards
(Labelling and Display) Regulations, 2020**, compendium **Version VIII,
09.09.2025**, 39 pages (`Comp_Labelling Display_Version VIII_09_09_2025.pdf`).
Page numbers below are the printed PDF page numbers.

This is an implementation review, not legal certification or an assessment of
the actual food. Later amendments, product standards, Advertising and Claims
Regulations, Organic Foods Regulations and Legal Metrology requirements need
separate current-law review before launch. The supplied compilation itself
includes a coffee-chicory amendment effective 1 July 2026; no such product is
listed. Do not apply drinking-water, infant-milk-powder, blended-oil or catering
rules indiscriminately to this catalogue.

## Implemented

| Finding | Reference | Change |
| --- | --- | --- |
| English names omitted the product form already stated in Tamil and shown in ingredient art | 4(5), p4; 5(1), p5 | Turmeric Powder, Ragi Flour, Bajra Flour and the three rice names now state their form. IDs, URLs, Tamil, prices, sizes and category navigation are unchanged. |
| Complete pre-sale label particulars are absent | 4(2), p4; 5, pp5–19 | Product detail page and quick view now show a concise pending notice with expandable details. A server-side `foodLabelReview.readyForSale = false` lock prevents live sales even if payment environment approvals are enabled. Sandbox/bag review remains available, not fulfilment. A pending notice **does not satisfy** the missing declarations. |
| “Asal Organics” could be mistaken for verified organic certification | 4(3), p4; 5(1)(c), p5; 5(7)(e), p16; Schedule I(2), p27 | Preserved the owner's existing brand rather than assuming a legal rebrand. Added explicit certification-status clarification in About and FAQ. No Jaivik Bharat, FSSAI or certification badge has been invented. Owner must verify the brand's use under the separate claims/organic rules. |
| Wordmark included an unsupported registered-trademark symbol | General misleading-impression precaution, not a specific trademark ruling under this PDF | Removed `®` pending registration evidence. Tamil paths, curved underline and drip animation remain unchanged. |

## Deferred at the owner's request: image labels

On 12 November 2026 the owner explicitly instructed: keep the existing images;
replacement images will be supplied later. All current product images, mappings,
sizes and credits are therefore unchanged. The proposed image substitutions and
asset relocation were undone before release.

The six displayed oil bottle labels contain “100% Natural”, “Pure Quality” and
“Traditionally Made”; substantiation and complete approved labels are not
available in this project. These expressions are **not declared categorically
prohibited** by this review, but still need evidence and assessment under the
applicable claims rules (4(3)–(4), p4; 5(1)(c), p5). Their continued display is
an unresolved review item, not a compliance finding. The pending notice and
live-sale lock do not establish that these images comply with advertising rules.

Reviewed public source includes storefront, category navigation, dialogs, product
pages, image mappings, bag/checkout, FAQ/About, image credits, metadata, JSON-LD,
logos and the six currently displayed bottle labels. No disease-treatment,
allergen-free, nutrition-benefit or invented certification claims were found in
the text. Natural-farming references to G. Nammalvar remain historical editorial
content with an explicit no-endorsement statement. Field/chekku/cattle artwork is
not evidence of farm ownership, animal breed or production method.

## Owner information required before any live sale

Supply readable approved **front, back and side labels for each product and
offered pack size**, and supporting business/product records. Do not fill these
fields from generic web nutrition tables or an image-generation tool.

1. **Identity and method:** confirm actual food name, single-ingredient versus
   blend, and evidence for cold-pressed, wood-pressed and bilona descriptions.
   Those existing owner-specified descriptions are retained but not independently
   validated. Confirm the flour/powder/rice forms against actual merchandise.
2. **Ingredients/additives:** recipe in descending weight/volume order, applicable
   compound ingredients, additive classes/names or INS numbers and flavour
   declarations; review emphasized-ingredient quantities where required
   (5(2), pp5–9; 5(5), pp14–15). Single-ingredient exemption is not a blanket
   exemption for an entire category.
3. **Nutrition:** approved values, basis (100 g/100 ml or single consumption pack),
   serving quantity, servings per pack and applicable per-serve RDA information
   (5(3), pp9–13). Edible-oil declarations include saturated/trans fats and
   mono-/polyunsaturated fatty acids, omega-3 and omega-6 (p12). Do not infer zero
   trans fat from “cold-pressed”. Spice/curry-powder and unprocessed
   single-ingredient exemptions need product-specific review; flour is not
   automatically unprocessed, and claims can require otherwise-exempt nutrition.
4. **Vegetarian/non-vegetarian status:** verify all ingredients, processing aids
   and additives before publishing the correct symbol near the food identity.
   5(4), pp13–14 also covers advertisements. Liquid milk/milk powder exemptions
   do not automatically cover ghee, paneer, butter or sweets. Status cannot be
   certified just from an ingredient illustration.
5. **Allergens/cross-contact:** actual recipe and manufacturing assessment under
   5(14), pp18–19. Milk must be declared as “Milk” where applicable (e.g. in
   composite sweets); assess halwa ingredients, not just its milk-category
   assignment. The supplied text expressly exempts certain oils, products that
   are themselves allergens and raw agricultural commodities. Thus no blanket
   mandatory “Contains Nut” claim is imposed on all oils and no guessed
   “May contain” statement is published. Exemption does **not** mean allergen-free.
6. **Responsible operator/FSSAI:** verified legal names, complete addresses,
   correct “Manufactured/Marketed/Packed by” roles, actual logo/licence details
   for the relevant entities (5(6)–(7), pp15–16). No dummy number or competitor
   certificate. An owner statement that a certificate exists is not its details.
7. **Pack/price/customer care:** actual net quantity, MRP/retail-price declarations
   and consumer-care contact under 5(8), p16 and the applicable Legal Metrology
   rules. Current proportional prices are preview selling prices, not verified
   pack MRPs. Do not substitute the admin-login email for a consumer-care contact.
8. **Storage/use/origin:** verified refrigeration, after-opening handling, use
   directions and imported-food origin/importer information where applicable
   (5(10)(c), p17; 5(11)–(13), pp17–18).
9. **Claims/certification:** evidence for any natural/pure/organic/traditional
   claim and brand-name use, trademark registration if restoring `®`; approved
   organic certification/logo use where applicable. Do not represent the
   supplied compendium as an FSSAI certificate for Asal.
10. **Physical packs:** batch/lot, manufacturing/packing date, expiry/use-by and
    applicable date/storage statements still belong on actual packs (5(9)–(10),
    pp16–17). Regulation 4(2)'s online pre-sale exceptions do **not** remove these
    physical-label obligations. Review legibility, principal-display-panel
    sizing and any genuine package-size exemption (6–8, pp19–23) on the actual
    package dimensions; not on the website thumbnail.

## Release checklist

- Have an appropriately qualified food-labelling reviewer validate the evidence,
  applicability/exemptions and current rules.
- Publish the verified declarations readably in English or Hindi, with consistent
  Tamil where used, for every offered product/pack **before** sale. Do not hide
  them solely in unreadable bottle thumbnails, alt text or a generic disclaimer.
- Review the owner's forthcoming packaging images and their embedded claims
  before replacing the current images; update credits, alt text and asset tests
  as needed. Retire the pending notices only when the information is genuinely
  available.
- After that review, deliberately update `src/content/food-labels.ts` and tests.
  Do not bypass the lock with an environment variable. Other live prerequisites
  (`CATALOGUE_APPROVED`, `PURCHASE_TOTAL_APPROVED`, credentials, webhook and
  storage) must still pass independently.

## Verification

- `npm test`: 143 passed, one optional PostgreSQL integration test skipped.
- `npm run typecheck`: passed.
- Regression coverage includes clarified names/metadata, unchanged prices,
  IDs/categories and existing bottle mappings; pending notices; and live-payment
  rejection before provider/storage calls with either storage configuration.
- Browser checks at 1280px and 390px confirmed the restored groundnut bottle,
  readable expandable notices on the product page and quick view, and no
  horizontal page overflow. The organic-certification FAQ was also checked.
- `git diff -- public src/content/product-images.ts src/app/credits/page.tsx`
  is empty: no image, image mapping or image-credit changes.
- Isolated OpenNext production build and Cloudflare deployment passed. Worker
  version: `cb32e5b3-82c3-4ffe-bf98-31852cc0b799`. No image assets were uploaded.
- The live groundnut page was checked in-browser with the original bottle and
  expanded label notice. A read-only HTTP check also confirmed the updated Ragi
  Flour name and label notice on its live product page.
- The live public payment configuration still reports sandbox mode
  (`enabled: true`, `mode: test`); no real order or payment was submitted.

Graphify's CLI was unavailable during this review. Existing graph context was
verified against targeted source reads; `graphify update .` also failed because
the command was unavailable. No remote indexing was performed.
