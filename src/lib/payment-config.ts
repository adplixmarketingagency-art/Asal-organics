import "server-only";

export function paymentConfig() {
  const mode: "live" | "test" = process.env.PAYMENT_MODE === "live" ? "live" : "test";
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() ?? "";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "";
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  const enabled = process.env.PAYMENTS_ENABLED === "true";
  const catalogueApproved = process.env.CATALOGUE_APPROVED === "true";
  const purchaseTotalApproved = process.env.PURCHASE_TOTAL_APPROVED === "true";
  const credentialsMatchMode = keyId.startsWith(`rzp_${mode}_`) && Boolean(keySecret);
  return {
    mode,
    catalogueApproved,
    purchaseTotalApproved,
    // Sandbox checkout needs no merchant database. Live checkout remains fail-closed.
    enabled: enabled && credentialsMatchMode && (mode === "test" || (
      catalogueApproved && purchaseTotalApproved && Boolean(webhookSecret && databaseUrl)
    )),
    keyId, keySecret, webhookSecret, databaseUrl,
  };
}

export type PaymentConfig = ReturnType<typeof paymentConfig>;

export function paymentDisabledResponse() {
  return Response.json({ error: "Payments are not configured yet." }, {
    status: 503,
    headers: { "Cache-Control": "no-store", "Retry-After": "3600" },
  });
}
