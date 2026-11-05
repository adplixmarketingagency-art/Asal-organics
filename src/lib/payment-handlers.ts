import "server-only";
import { isRecord } from "./cart.ts";
import { prepareCheckoutReview } from "./checkout.ts";
import { createPendingOrder, attachRazorpayOrder, getOrder, markPaid } from "./orders.ts";
import { paymentConfig, paymentDisabledResponse } from "./payment-config.ts";
import { createRazorpayOrder, fetchRazorpayPayment, isValidPaymentAmount, validHmac } from "./razorpay.ts";
import { readPaymentOrder, signPaymentOrder } from "./payment-order-token.ts";

const headers = { "Cache-Control": "no-store" };
function json(body: unknown, status = 200) { return Response.json(body, { status, headers }); }

class RequestError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}

async function readBody(request: Request) {
  const origin = request.headers.get("origin");
  // Next may reconstruct request.url with its bind address (0.0.0.0), not the
  // browser's host. Compare the actual request host and proxy protocol instead.
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  const protocol = request.headers.get("x-forwarded-proto") ?? url.protocol.slice(0, -1);
  if (origin && origin !== `${protocol}://${host}`) throw new RequestError("Cross-origin payment requests are not allowed.", 403);
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    throw new RequestError("A JSON request is required.", 415);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("Payment details are missing.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16_384) { await reader.cancel(); throw new RequestError("Request is too large.", 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const result: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!isRecord(result)) throw new RequestError("Payment details must be a JSON object.");
    return result;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError("We couldn’t read the payment details.");
  } finally { reader.releaseLock(); }
}

function failure(error: unknown) {
  if (error instanceof RequestError) return json({ error: error.message }, error.status);
  if (isRecord(error) && Number(error.statusCode) === 401) {
    return json({ error: "Razorpay authentication failed. Please ask the store owner to check the payment keys." }, 401);
  }
  // Never return or log SDK errors: they can contain request credentials.
  return json({ error: "The payment service is unavailable. Please try again shortly." }, 500);
}

const dependencies = { paymentConfig, createPendingOrder, attachRazorpayOrder, getOrder, markPaid, createRazorpayOrder, fetchRazorpayPayment };

export function createPaymentHandlers(deps = dependencies) {
  return {
    async createOrder(request: Request) {
      const config = deps.paymentConfig();
      if (!config.enabled) return paymentDisabledResponse();
      try {
        const body = await readBody(request);
        if ("amount" in body && !isValidPaymentAmount(body.amount)) throw new RequestError("Amount must be an integer of at least 100 paise.");
        if ("currency" in body && body.currency !== "INR") throw new RequestError("Only INR payments are supported.");
        const result = prepareCheckoutReview(body);
        if (!result.ok) return json(result, 422);
        const amount = result.review.summary.subtotalPaise;
        if (!isValidPaymentAmount(amount)) throw new RequestError("Amount must be at least 100 paise.");
        // Browser prices/totals are never used to charge the customer.
        if ("amount" in body && body.amount !== amount) throw new RequestError("The amount does not match your bag.");
        const receipt = `asal_${crypto.randomUUID().replaceAll("-", "").slice(0, 30)}`;
        // Sandbox orders are never fulfilled and do not store customer data.
        const merchantOrder = config.mode === "live" ? await deps.createPendingOrder(result.review, receipt) : null;
        if (config.mode === "live" && !merchantOrder?.id) throw new Error("Merchant order was not saved.");
        const order = await deps.createRazorpayOrder(config, amount, receipt);
        if (!/^order_[a-zA-Z0-9]+$/.test(order.id) || order.amount !== amount || order.currency !== "INR") {
          throw new Error("Provider order does not match checkout.");
        }
        if (merchantOrder && !await deps.attachRazorpayOrder(merchantOrder.id, order.id)) throw new Error("Order attachment failed.");
        const orderToken = signPaymentOrder({
          orderId: order.id, merchantOrderId: merchantOrder?.id ?? null, amount, currency: "INR", mode: config.mode,
        }, config.keySecret);
        return json({ order_id: order.id, amount, currency: "INR", key_id: config.keyId, orderToken, mode: config.mode });
      } catch (error) { return failure(error); }
    },

    async verifyPayment(request: Request) {
      const config = deps.paymentConfig();
      if (!config.enabled) return paymentDisabledResponse();
      try {
        const body = await readBody(request);
        const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature, orderToken } = body;
        if (typeof orderId !== "string" || !/^order_[a-zA-Z0-9]+$/.test(orderId) ||
          typeof paymentId !== "string" || !/^pay_[a-zA-Z0-9]+$/.test(paymentId) ||
          typeof signature !== "string" || typeof orderToken !== "string") {
          throw new RequestError("Missing or invalid payment confirmation fields.");
        }
        const order = readPaymentOrder(orderToken, config.keySecret);
        if (!order || order.mode !== config.mode || order.orderId !== orderId) throw new RequestError("Invalid or expired checkout reference.");
        // Use the server-issued order ID, never an untrusted callback ID.
        if (!validHmac(`${order.orderId}|${paymentId}`, signature, config.keySecret)) throw new RequestError("Payment signature is invalid.");
        const stored = order.merchantOrderId ? await deps.getOrder(order.merchantOrderId) : null;
        if (config.mode === "live" && (!stored || stored.razorpayOrderId !== order.orderId ||
          stored.amountPaise !== order.amount || stored.currency !== order.currency)) throw new RequestError("Order not found.", 404);
        const payment = await deps.fetchRazorpayPayment(config, paymentId);
        if (payment.id !== paymentId || payment.order_id !== order.orderId || payment.amount !== order.amount || payment.currency !== order.currency) {
          throw new RequestError("Payment does not match this order.");
        }
        if (payment.status !== "captured") throw new RequestError("Payment is not captured yet. Retry verification; do not pay again.", 409);
        if (stored) {
          if (stored.status === "paid" && stored.paymentId !== paymentId) throw new RequestError("Order already has a different payment.", 409);
          if (!await deps.markPaid(stored.id, paymentId)) throw new RequestError("The order could not be confirmed. Contact the store with your payment reference.", 409);
        }
        return json({ ok: true, mode: config.mode, order_id: order.orderId, payment_id: paymentId, orderPlaced: Boolean(stored) });
      } catch (error) { return failure(error); }
    },
  };
}
