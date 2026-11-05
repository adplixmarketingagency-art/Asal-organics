import { getProductVariant, products, type Product, type ProductVariant } from "../content/products.ts";

export const CART_STORAGE_KEY = "asal-cart-v1";
export const MAX_ITEM_QUANTITY = 99;

export type CartItem = { productId: string; variantId: string; quantity: number };
export type CartLine = CartItem & {
  product: Product;
  variant: ProductVariant;
  unitPricePaise: number;
  lineTotalPaise: number;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Browser storage is untrusted; keep only known IDs and bounded, whole quantities. */
export function normalizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const lines = new Map<string, CartItem>();
  for (const item of value) {
    if (!isRecord(item) || typeof item.productId !== "string" ||
      typeof item.quantity !== "number" || !Number.isSafeInteger(item.quantity) || item.quantity < 1) continue;
    const variant = getProductVariant(item.productId, item.variantId);
    if (!variant) continue;
    lines.set(variant.id, {
      productId: item.productId, variantId: variant.id,
      quantity: Math.min(MAX_ITEM_QUANTITY, (lines.get(variant.id)?.quantity ?? 0) + item.quantity),
    });
  }
  return [...lines.values()];
}

export function parseStoredCart(raw: string | null): CartItem[] {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    return isRecord(value) && (value.version === 1 || value.version === 2) ? normalizeCart(value.items) : [];
  } catch {
    return [];
  }
}

export function serializeCart(items: CartItem[]): string {
  return JSON.stringify({ version: 2, items: normalizeCart(items) });
}

export function setCartQuantity(items: CartItem[], productId: string, quantity: number, variantId?: string): CartItem[] {
  const clean = normalizeCart(items);
  const variant = getProductVariant(productId, variantId);
  if (!variant || !Number.isSafeInteger(quantity) || quantity < 0) return clean;
  if (quantity === 0) return clean.filter((item) => item.variantId !== variant.id);
  const existing = clean.find((item) => item.variantId === variant.id);
  if (!existing) return [...clean, { productId, variantId: variant.id, quantity: Math.min(quantity, MAX_ITEM_QUANTITY) }];
  return clean.map((item) => item.variantId === variant.id ? { ...item, quantity: Math.min(quantity, MAX_ITEM_QUANTITY) } : item);
}

export function addCartItem(items: CartItem[], productId: string, variantId?: string): CartItem[] {
  const clean = normalizeCart(items);
  const variant = getProductVariant(productId, variantId);
  if (!variant) return clean;
  return setCartQuantity(clean, productId, (clean.find((item) => item.variantId === variant.id)?.quantity ?? 0) + 1, variant.id);
}

export function getCartSummary(items: CartItem[]) {
  const lines: CartLine[] = normalizeCart(items).map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId)!;
    const variant = getProductVariant(item.productId, item.variantId)!;
    const unitPricePaise = variant.price * 100;
    return { ...item, product, variant, unitPricePaise, lineTotalPaise: unitPricePaise * item.quantity };
  });
  return {
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotalPaise: lines.reduce((sum, line) => sum + line.lineTotalPaise, 0),
  };
}

export type CartSummary = ReturnType<typeof getCartSummary>;
