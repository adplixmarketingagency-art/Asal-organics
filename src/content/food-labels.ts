/**
 * Review against the owner's FSSAI compendium, Version VIII (09.09.2025).
 * No approved complete labels have been supplied for this catalogue.
 * Do not enable live sales by changing this flag alone: publish and review the
 * applicable declarations for every offered product/pack first.
 * See docs/food-label-review.md for evidence and the release checklist.
 */
export const foodLabelReview = {
  readyForSale: false,
  notice: "Label details are awaiting verification. Online ordering remains unavailable.",
  pendingDetails: "Ingredients, allergens, nutrition, vegetarian/non-vegetarian status, manufacturer or packer details, FSSAI licence, consumer-care details and storage directions need verification where applicable. No allergen-free status is claimed.",
  imageNotice: "Product images do not replace verified label information. Packaging claims remain under review.",
  brandNotice: "Asal Organics is our brand name. Product-specific organic certification has not been verified for this preview catalogue.",
};
