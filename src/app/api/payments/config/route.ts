import { paymentConfig } from "../../../../lib/payment-config";

export const dynamic = "force-dynamic";

export function GET() {
  const { enabled, mode } = paymentConfig();
  return Response.json({ enabled, mode }, { headers: { "Cache-Control": "no-store" } });
}
