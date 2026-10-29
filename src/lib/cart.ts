import { products, type Product } from "../content/products.ts";

export const CART_STORAGE_KEY = "asal-cart-v1";
export const MAX_ITEM_QUANTITY = 99;

export type CartItem = { productId: string; quantity: number };
export type CartLine = CartItem & {
  product: Product;
  unitPricePaise: number;
  lineTotalPaise: number;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Browser storage is untrusted; keep only known IDs and bounded, whole quantities. */
export function normalizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const quantities = new Map<string, number>();
  for (const item of value) {
    if (!isRecord(item) || typeof item.productId !== "string" ||
      !products.some((product) => product.id === item.productId) ||
      typeof item.quantity !== "number" || !Number.isSafeInteger(item.quantity) || item.quantity < 1) continue;
    quantities.set(item.productId, Math.min(MAX_ITEM_QUANTITY, (quantities.get(item.productId) ?? 0) + item.quantity));
  }
  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
}

export function parseStoredCart(raw: string | null): CartItem[] {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    return isRecord(value) && value.version === 1 ? normalizeCart(value.items) : [];
  } catch {
    return [];
  }
}

export function serializeCart(items: CartItem[]): string {
  return JSON.stringify({ version: 1, items: normalizeCart(items) });
}

export function setCartQuantity(items: CartItem[], productId: string, quantity: number): CartItem[] {
  const clean = normalizeCart(items);
  if (!products.some((product) => product.id === productId) || !Number.isSafeInteger(quantity) || quantity < 0) return clean;
  if (quantity === 0) return clean.filter((item) => item.productId !== productId);
  const existing = clean.find((item) => item.productId === productId);
  if (!existing) return [...clean, { productId, quantity: Math.min(quantity, MAX_ITEM_QUANTITY) }];
  return clean.map((item) => item.productId === productId ? { ...item, quantity: Math.min(quantity, MAX_ITEM_QUANTITY) } : item);
}

export function addCartItem(items: CartItem[], productId: string): CartItem[] {
  const clean = normalizeCart(items);
  return setCartQuantity(clean, productId, (clean.find((item) => item.productId === productId)?.quantity ?? 0) + 1);
}

export function getCartSummary(items: CartItem[]) {
  const lines: CartLine[] = normalizeCart(items).map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId)!;
    const unitPricePaise = Math.round(product.price * 100);
    return { ...item, product, unitPricePaise, lineTotalPaise: unitPricePaise * item.quantity };
  });
  return {
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotalPaise: lines.reduce((sum, line) => sum + line.lineTotalPaise, 0),
    savingsPaise: lines.reduce((sum, line) => sum + Math.round((line.product.originalPrice - line.product.price) * 100) * line.quantity, 0),
  };
}

export type CartSummary = ReturnType<typeof getCartSummary>;
