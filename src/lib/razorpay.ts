import "server-only";
import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "node:crypto";

function client(config: { keyId: string; keySecret: string }) {
  const sdk = new Razorpay({ key_id: config.keyId, key_secret: config.keySecret });
  // Use the SDK's fetch transport in both Node and Cloudflare's nodejs_compat runtime.
  const api = sdk.api as typeof sdk.api & { rq: { defaults: { adapter: string; timeout: number } } };
  api.rq.defaults.adapter = "fetch";
  api.rq.defaults.timeout = 15_000;
  return sdk;
}

export function isValidPaymentAmount(amount: unknown): amount is number {
  return typeof amount === "number" && Number.isSafeInteger(amount) && amount >= 100;
}

export async function createRazorpayOrder(config: { keyId: string; keySecret: string }, amount: number, receipt: string) {
  if (!isValidPaymentAmount(amount)) throw new Error("Amount must be at least 100 paise.");
  const order = await client(config).orders.create({ amount, currency: "INR", receipt, partial_payment: false });
  return { id: order.id, amount: Number(order.amount), currency: order.currency };
}

export async function fetchRazorpayPayment(config: { keyId: string; keySecret: string }, paymentId: string) {
  const payment = await client(config).payments.fetch(paymentId);
  return { id: payment.id, order_id: payment.order_id, amount: Number(payment.amount), currency: payment.currency, status: payment.status };
}
export function validHmac(value: string | Uint8Array, expected: string, secret: string) {
  if (!/^[a-f0-9]{64}$/i.test(expected)) return false;
  const actual = createHmac("sha256", secret).update(value).digest("hex");
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}
