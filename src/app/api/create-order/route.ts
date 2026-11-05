import { createPaymentHandlers } from "../../../lib/payment-handlers";

export const runtime = "nodejs";
export const POST = createPaymentHandlers().createOrder;
