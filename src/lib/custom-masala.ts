import { formatMoneyPaise } from "./checkout-pricing.ts";
import type { SavedCustomMasalaRequest } from "./custom-masala-request.ts";

/** Owner-supplied ingredient rates per 100 g; not ready-made masala prices. */
export const masalaIngredients = [
  { id: "coriander", name: "Coriander seeds", pricePer100g: 22 },
  { id: "chilli-long", name: "Dry chilli — long", pricePer100g: 35 },
  { id: "chilli-round", name: "Dry chilli — round", pricePer100g: 50 },
  { id: "chilli-kashmiri", name: "Dry chilli — Kashmiri", pricePer100g: 55 },
  { id: "turmeric", name: "Turmeric", pricePer100g: 30 },
  { id: "toor-dal", name: "Toor dal", pricePer100g: 17 },
  { id: "channa-dal", name: "Channa dal", pricePer100g: 15 },
  { id: "cumin", name: "Cumin seeds", pricePer100g: 70 },
  { id: "fennel", name: "Fennel seeds", pricePer100g: 48 },
  { id: "fenugreek", name: "Fenugreek", pricePer100g: 30 },
  { id: "ginger", name: "Dry ginger", pricePer100g: 80 },
  { id: "mustard", name: "Mustard", pricePer100g: 20 },
  { id: "curry-leaves", name: "Curry leaves", pricePer100g: 10 },
  { id: "asafetida", name: "Asafetida", pricePer100g: 120 },
  { id: "rice", name: "Raw rice", pricePer100g: 10 },
] as const;

export const GRINDING_PAISE_PER_KG = 3000;
export const MAX_INGREDIENT_GRAMS = 10_000;
const whatsappNumber = "917305597782";
type Ingredient = typeof masalaIngredients[number];
export type CustomMasalaLine = {
  ingredient: Ingredient;
  grams: number;
  pricePaise: number;
};
export type CustomMasalaQuote = {
  lines: CustomMasalaLine[];
  errors: Record<string, string>;
  totalGrams: number;
  ingredientsPaise: number;
  grindingPaise: number;
  totalPaise: number | null;
};

/** Work in tenths of a gram and integer paise; blank fields are optional. */
export function calculateCustomMasala(quantities: Record<string, string>): CustomMasalaQuote {
  const lines: CustomMasalaLine[] = [];
  const errors: Record<string, string> = {};
  let totalTenths = 0;
  let ingredientsPaise = 0;
  for (const ingredient of masalaIngredients) {
    const raw = (quantities[ingredient.id] ?? "").trim();
    if (!raw) continue;
    const grams = Number(raw);
    if (!/^(?:\d+(?:\.\d?)?|\.\d)$/.test(raw) || !Number.isFinite(grams) ||
      grams < 0 || grams > MAX_INGREDIENT_GRAMS) {
      errors[ingredient.id] = "Enter 0–10,000 g, with up to one decimal place.";
      continue;
    }
    if (grams === 0) continue;
    const tenths = Math.round(grams * 10);
    const pricePaise = Math.round(tenths * ingredient.pricePer100g / 10);
    totalTenths += tenths;
    ingredientsPaise += pricePaise;
    lines.push({ ingredient, grams: tenths / 10, pricePaise });
  }
  const grindingPaise = Math.round(totalTenths * GRINDING_PAISE_PER_KG / 10_000);
  return {
    lines, errors, totalGrams: totalTenths / 10, ingredientsPaise, grindingPaise,
    totalPaise: Object.keys(errors).length ? null : ingredientsPaise + grindingPaise,
  };
}

/** A user-opened draft, not an automatic message, order or checkout payment. */
export function customMasalaWhatsAppUrl(quote: CustomMasalaQuote, details?: { receipt: string; otherIngredients: string }): string | null {
  if (quote.totalPaise === null || Object.keys(quote.errors).length) return null;
  const text = [
    "Hello Asal, I would like a customised masala.",
    ...(details ? [`Request: ${details.receipt}`] : []),
    "",
    ...quote.lines.map(({ ingredient, grams, pricePaise }, index) =>
      `${index + 1}. ${ingredient.name}: ${grams} g (₹${ingredient.pricePer100g}/100 g) — ${formatMoneyPaise(pricePaise)}`),
    ...(quote.lines.length ? [] : ["Listed ingredient quantities: not specified yet."]),
    "",
    `Total quantity: ${quote.totalGrams} g`,
    `Ingredients: ${formatMoneyPaise(quote.ingredientsPaise)}`,
    `Grinding (₹30/kg): ${formatMoneyPaise(quote.grindingPaise)}`,
    `Calculated total: ${formatMoneyPaise(quote.totalPaise)}`,
    "",
    `Other items: ${details?.otherIngredients || "I will mention them in this chat."}`,
    "Other-item quantities/prices and delivery are not included in this calculation.",
    "Please confirm availability and the final quote.",
  ].join("\n");
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
}

/** Use the durable server snapshot for both draft amounts and ingredient rates. */
export function savedCustomMasalaWhatsAppUrl(saved: SavedCustomMasalaRequest): string {
  const recipe = saved.recipe;
  const text = [
    "Hello Asal, I would like a customised masala.",
    `Request: ${saved.receipt}`, "",
    ...recipe.ingredients.map((line, index) =>
      `${index + 1}. ${line.name}: ${line.grams} g (₹${line.pricePer100g}/100 g) — ${formatMoneyPaise(line.pricePaise)}`),
    ...(recipe.ingredients.length ? [] : ["Listed ingredient quantities: not specified yet."]), "",
    `Total quantity: ${recipe.totalGrams} g`,
    `Ingredients: ${formatMoneyPaise(recipe.ingredientsPaise)}`,
    `Grinding (₹30/kg): ${formatMoneyPaise(recipe.grindingPaise)}`,
    `Calculated total: ${formatMoneyPaise(recipe.totalPaise)}`, "",
    `Other items: ${recipe.otherIngredients || "I will mention them in this chat."}`,
    "Other-item quantities/prices and delivery are not included in this calculation.",
    "Please confirm availability and the final quote.",
  ].join("\n");
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
}
