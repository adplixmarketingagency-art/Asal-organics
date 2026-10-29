import "server-only";

export function paymentConfig() {
  const mode = process.env.PAYMENT_MODE === "live" ? "live" : "test";
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() ?? "";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "";
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  const enabled = process.env.PAYMENTS_ENABLED === "true";
  const catalogueApproved = process.env.CATALOGUE_APPROVED === "true";
  const purchaseTotalApproved = process.env.PURCHASE_TOTAL_APPROVED === "true";
  return {
    mode,
    catalogueApproved,
    purchaseTotalApproved,
    enabled: enabled && catalogueApproved && purchaseTotalApproved && Boolean(keyId && keySecret && webhookSecret && databaseUrl),
    keyId, keySecret, webhookSecret, databaseUrl,
  };
}

export function paymentDisabledResponse() {
  return Response.json({ error: "Payments are not configured yet." }, {
    status: 503,
    headers: { "Cache-Control": "no-store", "Retry-After": "3600" },
  });
}
