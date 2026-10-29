import { fetchRazorpayPayment, validHmac } from "../../../../lib/razorpay";
import { getOrder, markPaid } from "../../../../lib/orders";
import { paymentConfig, paymentDisabledResponse } from "../../../../lib/payment-config";

export async function POST(request: Request) {
  const config = paymentConfig(); if (!config.enabled) return paymentDisabledResponse();
  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.orderId !== "string" || typeof body.paymentId !== "string" || typeof body.signature !== "string") return Response.json({ error: "Invalid payment confirmation." }, { status: 400 });
    const order = await getOrder(body.orderId); if (!order?.razorpayOrderId) return Response.json({ error: "Order not found." }, { status: 404 });
    if (!validHmac(`${order.razorpayOrderId}|${body.paymentId}`, body.signature, config.keySecret)) return Response.json({ error: "Payment signature is invalid." }, { status: 400 });
    const payment = await fetchRazorpayPayment(config, body.paymentId);
    if (payment.order_id !== order.razorpayOrderId || payment.amount !== order.amountPaise || payment.currency !== order.currency || payment.status !== "captured") return Response.json({ error: "Payment has not been captured." }, { status: 409 });
    await markPaid(order.id, payment.id);
    return Response.json({ ok: true, orderId: order.id }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "We couldn’t verify this payment." }, { status: 400 }); }
}
