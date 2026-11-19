import { calculateCustomMasala, masalaIngredients } from "./custom-masala.ts";
import { isRecord } from "./cart.ts";

export type CustomMasalaRecipe = {
  version: 1;
  ingredients: { id: string; name: string; grams: number; pricePer100g: number; pricePaise: number }[];
  totalGrams: number;
  ingredientsPaise: number;
  grindingPaise: number;
  totalPaise: number;
  otherIngredients: string;
};
export type CustomMasalaRequest = { requestId: string; recipe: CustomMasalaRecipe };
export type SavedCustomMasalaRequest = { id: string; receipt: string; recipe: CustomMasalaRecipe };
type Result = { ok: true; request: CustomMasalaRequest } | { ok: false; error: string };

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
  return { ok: true, request: { requestId: value.requestId.toLowerCase(), recipe: {
    version: 1,
    ingredients: quote.lines.map(({ ingredient, grams, pricePaise }) => ({
      id: ingredient.id, name: ingredient.name, grams, pricePer100g: ingredient.pricePer100g, pricePaise,
    })),
    totalGrams: quote.totalGrams, ingredientsPaise: quote.ingredientsPaise,
    grindingPaise: quote.grindingPaise, totalPaise: quote.totalPaise, otherIngredients,
  } } };
}
