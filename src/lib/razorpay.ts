import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

function basic(config: { keyId: string; keySecret: string }) { return `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`; }
export async function createRazorpayOrder(config: { keyId: string; keySecret: string }, amount: number, receipt: string) {
  const response = await fetch("https://api.razorpay.com/v1/orders", { method: "POST", headers: { Authorization: basic(config), "Content-Type": "application/json" }, body: JSON.stringify({ amount, currency: "INR", receipt, partial_payment: false }), cache: "no-store" });
  if (!response.ok) throw new Error("Razorpay order creation failed");
  return response.json() as Promise<{ id: string; amount: number; currency: string }>;
}
export async function fetchRazorpayPayment(config: { keyId: string; keySecret: string }, paymentId: string) {
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: basic(config) }, cache: "no-store" });
  if (!response.ok) throw new Error("Razorpay payment lookup failed");
  return response.json() as Promise<{ id: string; order_id: string; amount: number; currency: string; status: string }>;
}
export function validHmac(value: string, expected: string, secret: string) {
  const actual = createHmac("sha256", secret).update(value).digest("hex");
  const a = Buffer.from(actual, "utf8"); const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
