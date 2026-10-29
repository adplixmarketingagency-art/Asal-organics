import { products } from "../content/products.ts";
import { getCartSummary, isRecord, MAX_ITEM_QUANTITY, type CartItem } from "./cart.ts";

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

export type CheckoutDetails = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};
export type CheckoutErrors = Partial<Record<keyof CheckoutDetails, string>>;
export const EMPTY_CHECKOUT_DETAILS: CheckoutDetails = {
  fullName: "", email: "", phone: "", address: "", apartment: "", city: "", state: "", pincode: "", country: "IN",
};

export function validateCheckoutDetails(value: unknown): { details: CheckoutDetails; errors: CheckoutErrors } {
  const input = isRecord(value) ? value : {};
  const details = Object.fromEntries(Object.keys(EMPTY_CHECKOUT_DETAILS).map((key) => [
    key, typeof input[key] === "string" ? input[key].trim() : "",
  ])) as CheckoutDetails;
  const errors: CheckoutErrors = {};
  if (details.fullName.length < 2 || details.fullName.length > 100) errors.fullName = "Enter your full name (2–100 characters).";
  if (details.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) errors.email = "Enter a valid email address.";
  const phone = details.phone.replace(/[\s()-]/g, "").replace(/^(?:\+91|0091)/, "");
  if (!/^[6-9]\d{9}$/.test(phone)) errors.phone = "Enter a valid 10-digit Indian mobile number.";
  else details.phone = phone;
  if (details.address.length < 5 || details.address.length > 200) errors.address = "Enter your house number and street (5–200 characters).";
  if (details.apartment.length > 100) errors.apartment = "Keep the apartment or landmark under 100 characters.";
  if (details.city.length < 2 || details.city.length > 100) errors.city = "Enter your city (2–100 characters).";
  if (!(INDIAN_STATES as readonly string[]).includes(details.state)) errors.state = "Choose a state or union territory.";
  if (!/^[1-9]\d{5}$/.test(details.pincode)) errors.pincode = "Enter a valid 6-digit Indian PIN code.";
  if (details.country !== "IN") errors.country = "Only Indian addresses are supported at this stage.";
  return { details, errors };
}

export type CheckoutReview = {
  status: "review_ready";
  currency: "INR";
  customer: CheckoutDetails;
  summary: ReturnType<typeof getCartSummary>;
  shipping: "not_configured";
  tax: "not_configured";
  payment: { provider: "razorpay"; enabled: false };
};

type ReviewResult =
  | { ok: true; review: CheckoutReview }
  | { ok: false; error: string; fieldErrors?: CheckoutErrors };

/** A review is NOT an order. Recompute prices here, never trust client totals. */
export function prepareCheckoutReview(value: unknown): ReviewResult {
  if (!isRecord(value) || !Array.isArray(value.items) || !value.items.length) {
    return { ok: false, error: "Your bag is empty. Add an oil before checking out." };
  }
  if (value.items.length > products.length) return { ok: false, error: "Your bag contains too many product lines." };
  const seen = new Set<string>();
  const items: CartItem[] = [];
  for (const item of value.items) {
    if (!isRecord(item) || typeof item.productId !== "string" ||
      !products.some((product) => product.id === item.productId) || seen.has(item.productId) ||
      typeof item.quantity !== "number" || !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 || item.quantity > MAX_ITEM_QUANTITY) {
      return { ok: false, error: "Your bag has an invalid product or quantity. Please update your bag and try again." };
    }
    seen.add(item.productId);
    items.push({ productId: item.productId, quantity: item.quantity });
  }
  const { details, errors } = validateCheckoutDetails(value.customer);
  if (Object.keys(errors).length) return { ok: false, error: "Please check your delivery details.", fieldErrors: errors };
  return {
    ok: true,
    review: {
      status: "review_ready", currency: "INR", customer: details, summary: getCartSummary(items),
      shipping: "not_configured", tax: "not_configured", payment: { provider: "razorpay", enabled: false },
    },
  };
}
