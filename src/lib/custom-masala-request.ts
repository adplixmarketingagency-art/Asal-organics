import { calculateCustomMasala, masalaIngredients } from "./custom-masala.ts";
import { isRecord } from "./cart.ts";
import { validateCheckoutDetails, type CheckoutDetails, type CheckoutErrors } from "./checkout.ts";

export type CustomMasalaRecipe = {
  version: 1;
  ingredients: { id: string; name: string; grams: number; pricePer100g: number; pricePaise: number }[];
  totalGrams: number;
  ingredientsPaise: number;
  grindingPaise: number;
  totalPaise: number;
  otherIngredients: string;
};
export type CustomMasalaRequest = { requestId: string; recipe: CustomMasalaRecipe; customer: CheckoutDetails };
export type SavedCustomMasalaRequest = { id: string; receipt: string; recipe: CustomMasalaRecipe; customer?: CheckoutDetails };
type Result = { ok: true; request: CustomMasalaRequest } | { ok: false; error: string; fieldErrors?: CheckoutErrors };

export function validateCustomMasalaCustomer(value: unknown) {
  const result = validateCheckoutDetails(value);
  // A WhatsApp enquiry needs phone/address, not a mandatory email.
  if (result.details.email === "") delete result.errors.email;
  return result;
}

export function prepareCustomMasalaRequest(value: unknown): Result {
  if (!isRecord(value) || typeof value.requestId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.requestId)) {
    return { ok: false, error: "Refresh the recipe and try saving again." };
  }
  if (!isRecord(value.quantities) || Object.entries(value.quantities).some(([id, amount]) =>
    !masalaIngredients.some((ingredient) => ingredient.id === id) || typeof amount !== "string" || amount.length > 8)) {
    return { ok: false, error: "Check the ingredient quantities." };
  }
  if (typeof value.otherIngredients !== "string" || value.otherIngredients.length > 1000) {
    return { ok: false, error: "Keep other ingredients under 1,000 characters." };
  }
  const otherIngredients = value.otherIngredients.trim();
  const quote = calculateCustomMasala(value.quantities as Record<string, string>);
  if (quote.totalPaise === null || (!quote.lines.length && !otherIngredients)) {
    return { ok: false, error: "Enter an ingredient quantity or describe other ingredients." };
  }
  const { details: customer, errors: fieldErrors } = validateCustomMasalaCustomer(value.customer);
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Please complete your name, phone and delivery address.", fieldErrors };
  return { ok: true, request: { requestId: value.requestId.toLowerCase(), customer, recipe: {
    version: 1,
    ingredients: quote.lines.map(({ ingredient, grams, pricePaise }) => ({
      id: ingredient.id, name: ingredient.name, grams, pricePer100g: ingredient.pricePer100g, pricePaise,
    })),
    totalGrams: quote.totalGrams, ingredientsPaise: quote.ingredientsPaise,
    grindingPaise: quote.grindingPaise, totalPaise: quote.totalPaise, otherIngredients,
  } } };
}
