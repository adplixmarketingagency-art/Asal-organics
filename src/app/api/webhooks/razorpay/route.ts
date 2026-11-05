import { recordWebhook, markPaid, getOrderByRazorpayId } from "../../../../lib/orders";
import { paymentConfig } from "../../../../lib/payment-config";
import { fetchRazorpayPayment, validHmac } from "../../../../lib/razorpay";
import { BodyTooLargeError, readBoundedBody } from "../../../../lib/request-body";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const config = paymentConfig();
  if (!config.enabled || config.mode !== "live" || !config.webhookSecret || !config.databaseUrl) return new Response(null, { status: 404 });
  let raw: Uint8Array;
  try {
    raw = await readBoundedBody(request, 256 * 1024);
  } catch (error) {
    return Response.json({ error: error instanceof BodyTooLargeError ? "Webhook is too large" : "Invalid webhook body" },
      { status: error instanceof BodyTooLargeError ? 413 : 400, headers: { "Cache-Control": "no-store" } });
  }
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!validHmac(raw, signature, config.webhookSecret)) return Response.json({ error: "Invalid signature" }, { status: 400 });
  const eventId = request.headers.get("x-razorpay-event-id"); if (!eventId) return Response.json({ error: "Missing event id" }, { status: 400 });
  try {
    const payload = JSON.parse(new TextDecoder().decode(raw)) as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
    const payment = payload.payload?.payment?.entity; const order = payment?.order_id ? await getOrderByRazorpayId(payment.order_id) : null;
    if (payload.event === "payment.captured" && payment?.id && order?.id) {
      const verified = await fetchRazorpayPayment(config, payment.id);
      if (verified.id !== payment.id || verified.status !== "captured" || verified.order_id !== order.razorpayOrderId ||
        verified.amount !== order.amountPaise || verified.currency !== order.currency) {
        return Response.json({ error: "Payment does not match order" }, { status: 400 });
      }
      if (!await markPaid(order.id, verified.id)) return Response.json({ error: "Order could not be confirmed" }, { status: 409 });
    }
    // Record only after processing succeeds; transient errors must be retryable.
    // markPaid and its notification insertion are transactionally idempotent.
    await recordWebhook(eventId, order?.id ?? null, payload.event ?? "unknown", payload);
    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error instanceof SyntaxError ? "Invalid webhook" : "Webhook processing failed" }, { status: error instanceof SyntaxError ? 400 : 500 });
  }
}
