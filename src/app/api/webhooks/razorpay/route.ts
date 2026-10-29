import { recordWebhook, markPaid, getOrderByRazorpayId } from "../../../../lib/orders";
import { paymentConfig } from "../../../../lib/payment-config";
import { fetchRazorpayPayment, validHmac } from "../../../../lib/razorpay";

export async function POST(request: Request) {
  const config = paymentConfig(); if (!config.webhookSecret) return new Response(null, { status: 404 });
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 256 * 1024) return Response.json({ error: "Webhook is too large" }, { status: 413 });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 256 * 1024) return Response.json({ error: "Webhook is too large" }, { status: 413 });
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!validHmac(raw, signature, config.webhookSecret)) return Response.json({ error: "Invalid signature" }, { status: 400 });
  const eventId = request.headers.get("x-razorpay-event-id"); if (!eventId) return Response.json({ error: "Missing event id" }, { status: 400 });
  try {
    const payload = JSON.parse(raw) as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
    const payment = payload.payload?.payment?.entity; const order = payment?.order_id ? await getOrderByRazorpayId(payment.order_id) : null;
    const fresh = await recordWebhook(eventId, order?.id ?? null, payload.event ?? "unknown", payload);
    if (fresh && payload.event === "payment.captured" && payment?.id && order?.id) {
      const verified = await fetchRazorpayPayment(config, payment.id);
      const stored = await getOrderByRazorpayId(verified.order_id);
      if (verified.status === "captured" && verified.currency === "INR" && stored?.id === order.id) await markPaid(order.id, verified.id);
    }
    return Response.json({ received: true });
  } catch { return Response.json({ error: "Invalid webhook" }, { status: 400 }); }
}
