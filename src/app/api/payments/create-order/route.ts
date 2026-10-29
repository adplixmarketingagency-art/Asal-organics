import { prepareCheckoutReview } from "../../../../lib/checkout";
import { createPendingOrder, attachRazorpayOrder } from "../../../../lib/orders";
import { paymentConfig, paymentDisabledResponse } from "../../../../lib/payment-config";
import { createRazorpayOrder } from "../../../../lib/razorpay";

export async function POST(request: Request) {
  const config = paymentConfig();
  if (!config.enabled) return paymentDisabledResponse();
  try {
    if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
      return Response.json({ error: "A JSON request is required." }, { status: 415 });
    }
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 64 * 1024) return Response.json({ error: "Request is too large." }, { status: 413 });
    const body = await request.json();
    const review = prepareCheckoutReview(body);
    if (!review.ok) return Response.json(review, { status: 422, headers: { "Cache-Control": "no-store" } });
    const receipt = `asal_${crypto.randomUUID().replaceAll("-", "").slice(0, 30)}`;
    const order = await createPendingOrder(review.review, receipt);
    try {
      const razorpay = await createRazorpayOrder(config, order.amountPaise, receipt);
      await attachRazorpayOrder(order.id, razorpay.id);
      return Response.json({ orderId: order.id, razorpayOrderId: razorpay.id, keyId: config.keyId, amount: razorpay.amount, currency: razorpay.currency }, { headers: { "Cache-Control": "no-store" } });
    } catch { return Response.json({ error: "Payment setup failed. Please try again." }, { status: 502 }); }
  } catch { return Response.json({ error: "We couldn’t start payment." }, { status: 400 }); }
}
