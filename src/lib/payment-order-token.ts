import "server-only";
import { createHmac } from "node:crypto";
import { isRecord } from "./cart.ts";
import { isValidPaymentAmount, validHmac } from "./razorpay.ts";

type PaymentOrder = {
  orderId: string;
  merchantOrderId: string | null;
  amount: number;
  currency: "INR";
  mode: "test" | "live";
};

// No customer details: binds verification to our server-issued order and amount,
// even in sandbox mode without a merchant database.
export function signPaymentOrder(order: PaymentOrder, secret: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ ...order, expires: now + 24 * 60 * 60 * 1000 })).toString("base64url");
  const signature = createHmac("sha256", secret).update(`asal:checkout:v1:${payload}`).digest("hex");
  return `${payload}.${signature}`;
}

export function readPaymentOrder(token: string, secret: string, now = Date.now()): PaymentOrder | null {
  if (token.length > 2048) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !validHmac(`asal:checkout:v1:${parts[0]}`, parts[1], secret)) return null;
  try {
    const order: unknown = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (!isRecord(order) || typeof order.orderId !== "string" || !/^order_[a-zA-Z0-9]+$/.test(order.orderId) ||
      !(order.merchantOrderId === null || (typeof order.merchantOrderId === "string" && /^[a-f0-9-]{36}$/i.test(order.merchantOrderId))) ||
      !isValidPaymentAmount(order.amount) || order.currency !== "INR" ||
      (order.mode !== "test" && order.mode !== "live") ||
      typeof order.expires !== "number" || order.expires <= now) return null;
    return order as PaymentOrder;
  } catch { return null; }
}
