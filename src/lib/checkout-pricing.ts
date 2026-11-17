import type { Product } from "../content/products.ts";
import type { CartSummary } from "./cart.ts";

export const OIL_GST_PERCENT = 5;
/** Final customer charge once per order; applicable delivery GST is included. */
export const DELIVERY_CHARGE_PAISE = 4900;
const oilHsn: Record<string, string> = {
  groundnut: "1508", sesame: "1515", coconut: "1513",
  "wood-groundnut": "1508", "wood-sesame": "1515", "wood-coconut": "1513",
};
export const oilTaxNote = "Price includes 5% GST.";
export const deliveryNote = "₹49 delivery per order, including applicable delivery GST.";

export function isEdibleOil(product: Pick<Product, "id">) {
  return Object.hasOwn(oilHsn, product.id);
}

export type CheckoutPricing = {
  /** Version 1 snapshots added GST; version 2 prices already include it. */
  version: 1 | 2;
  priceIncludesGst?: boolean;
  subtotalPaise: number;
  oilSubtotalPaise: number;
  oilGstPercent: typeof OIL_GST_PERCENT;
  oilGstPaise: number;
  deliveryPaise: number;
  deliveryGstIncludedPaise: number | null;
  totalPaise: number;
  taxStatus: "oil_rates_verified" | "partially_configured";
  pendingTaxProductIds: string[];
};

/** Extract included oil GST for records; never add it to the owner's prices again. */
export function getCheckoutPricing(summary: CartSummary): CheckoutPricing {
  const oils = summary.lines.filter(({ product }) => isEdibleOil(product));
  const pendingTaxProductIds = [...new Set(summary.lines
    .filter(({ product }) => !isEdibleOil(product)).map(({ product }) => product.id))];
  const oilSubtotalPaise = oils.reduce((sum, line) => sum + line.lineTotalPaise, 0);
  const oilGstPaise = oils.reduce((sum, line) => sum + Math.round(line.lineTotalPaise * OIL_GST_PERCENT / (100 + OIL_GST_PERCENT)), 0);
  const deliveryPaise = summary.lines.length ? DELIVERY_CHARGE_PAISE : 0;
  const taxStatus = pendingTaxProductIds.length ? "partially_configured" : "oil_rates_verified";
  return {
    version: 2, priceIncludesGst: true, subtotalPaise: summary.subtotalPaise, oilSubtotalPaise,
    oilGstPercent: OIL_GST_PERCENT, oilGstPaise, deliveryPaise,
    // Supplier-arranged delivery follows the goods' GST treatment. Never add
    // another tax on top of the owner's final ₹49 delivery charge.
    deliveryGstIncludedPaise: taxStatus === "oil_rates_verified"
      ? Math.round(deliveryPaise * OIL_GST_PERCENT / (100 + OIL_GST_PERCENT)) : null,
    totalPaise: summary.subtotalPaise + deliveryPaise,
    taxStatus, pendingTaxProductIds,
  };
}

/** Unlike catalogue pack prices, checkout amounts can contain fractional rupees. */
export function formatMoneyPaise(amountPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR",
    minimumFractionDigits: amountPaise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amountPaise / 100);
}
