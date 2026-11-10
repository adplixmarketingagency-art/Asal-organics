"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CreditCard, MapPin, Pencil } from "lucide-react";
import { INDIAN_STATES, validateCheckoutDetails, type CheckoutDetails, type CheckoutErrors, type CheckoutReview } from "@/lib/checkout";
import { isRecord } from "@/lib/cart";
import { CommerceLayout, EmptyBag, OrderSummary } from "./CommerceLayout";
import { useCart } from "./CartProvider";

type PaymentConfirmation = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  orderToken: string;
};

async function paymentRequest(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body), signal: AbortSignal.timeout(25_000),
  });
  const result: unknown = await response.json();
  if (!response.ok) throw new Error(isRecord(result) && typeof result.error === "string" ? result.error : "The payment service is unavailable.");
  if (!isRecord(result)) throw new Error("The payment response was incomplete.");
  return result;
}

const fields: { key: keyof CheckoutDetails; label: string; autoComplete: string; type?: string; wide?: boolean; maxLength: number; optional?: boolean }[] = [
  { key: "fullName", label: "Full name", autoComplete: "name", wide: true, maxLength: 100 },
  { key: "email", label: "Email address", autoComplete: "email", type: "email", maxLength: 254 },
  { key: "phone", label: "Mobile number", autoComplete: "tel-national", type: "tel", maxLength: 20 },
  { key: "address", label: "House number & street", autoComplete: "address-line1", wide: true, maxLength: 200 },
  { key: "apartment", label: "Apartment, landmark, etc.", autoComplete: "address-line2", wide: true, maxLength: 100, optional: true },
  { key: "city", label: "City", autoComplete: "address-level2", maxLength: 100 },
  { key: "pincode", label: "PIN code", autoComplete: "postal-code", maxLength: 6 },
];

export function CheckoutPage() {
  const { ready, items, summary, storageWarning, checkoutDetails, setCheckoutDetails, removePurchasedItems } = useCart();
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<{ enabled: boolean; mode: "test" | "live" } | null>(null);
  const [settingsError, setSettingsError] = useState("");
  const [settingsAttempt, setSettingsAttempt] = useState(0);
  const [scriptReady, setScriptReady] = useState(false);
  const [confirmation, setConfirmation] = useState<PaymentConfirmation | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<{ mode: string; orderId: string } | null>(null);
  const [review, setReview] = useState<{ data: CheckoutReview; cartKey: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const reviewRef = useRef<HTMLElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const paymentLock = useRef(false);
  const paymentStage = useRef<"idle" | "modal" | "verifying">("idle");
  const paymentReview = useRef<CheckoutReview | null>(null);
  const mounted = useRef(false);
  const modal = useRef<{ close(): void } | null>(null);
  const cartKey = JSON.stringify(items);
  // Keep the original payment review available for retries even if another tab edits the bag.
  const currentReview = (paymentPending || confirmation) && paymentReview.current
    ? paymentReview.current : review?.cartKey === cartKey ? review.data : null;
  const cartChanged = review !== null && review.cartKey !== cartKey;

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; modal.current?.close(); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setSettingsError("");
    setPaymentSettings(null);
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    fetch("/api/payments/config", { signal: controller.signal, cache: "no-store" })
      .then((response) => { if (!response.ok) throw new Error(); return response.json(); })
      .then((value: unknown) => {
        if (!isRecord(value) || typeof value.enabled !== "boolean" || (value.mode !== "test" && value.mode !== "live")) throw new Error();
        if (active) setPaymentSettings({ enabled: value.enabled, mode: value.mode });
      })
      .catch(() => { if (active) setSettingsError("We couldn’t load payment availability. Check your connection and try again."); })
      .finally(() => window.clearTimeout(timeout));
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [settingsAttempt]);
  useEffect(() => {
    if (currentReview) {
      reviewRef.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [currentReview]);

  function updateField(key: keyof CheckoutDetails, value: string) {
    setCheckoutDetails((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
    setError("");
    setReview(null);
  }

  function focusFirstError(fieldErrors: CheckoutErrors) {
    const first = Object.keys(fieldErrors)[0];
    formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestRef.current) return;
    const validation = validateCheckoutDetails(checkoutDetails);
    setErrors(validation.errors);
    setError("");
    if (Object.keys(validation.errors).length) {
      setError("Please check the highlighted delivery details.");
      focusFirstError(validation.errors);
      return;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    setPending(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, customer: validation.details }), signal: controller.signal,
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        if (isRecord(result) && isRecord(result.fieldErrors)) {
          const serverErrors = Object.fromEntries(Object.entries(result.fieldErrors).filter(([key, message]) => key in checkoutDetails && typeof message === "string")) as CheckoutErrors;
          setErrors(serverErrors);
          focusFirstError(serverErrors);
        }
        throw new Error(isRecord(result) && typeof result.error === "string" ? result.error : "We couldn’t review your bag. Please try again.");
      }
      if (!isRecord(result) || result.status !== "review_ready") throw new Error("The checkout response was incomplete. Please try again.");
      setCheckoutDetails(validation.details);
      setReview({ data: result as CheckoutReview, cartKey });
    } catch (cause) {
      setError(cause instanceof Error && cause.name !== "AbortError" ? cause.message : "The review took too long. Check your connection and try again.");
    } finally {
      window.clearTimeout(timeout);
      requestRef.current = null;
      setPending(false);
    }
  }

  function unlockPayment() {
    paymentLock.current = false;
    paymentStage.current = "idle";
    setPaymentPending(false);
  }

  async function verifyPayment(payment: PaymentConfirmation) {
    paymentLock.current = true;
    paymentStage.current = "verifying";
    setPaymentPending(true);
    setError("");
    try {
      const verified = await paymentRequest("/api/verify-payment", payment);
      if (verified.ok !== true || verified.order_id !== payment.razorpay_order_id ||
        (verified.mode !== "test" && verified.mode !== "live")) throw new Error("Payment confirmation was incomplete.");
      if (verified.mode === "live" && verified.orderPlaced !== true) throw new Error("The order has not been confirmed.");
      // Sandbox payments never clear the bag or claim a fulfilment order.
      if (verified.mode === "live") removePurchasedItems(paymentReview.current?.summary.lines ?? []);
      if (!mounted.current) return;
      setPaymentSuccess({ mode: verified.mode, orderId: payment.razorpay_order_id });
      setConfirmation(null);
    } catch (cause) {
      setError(`${cause instanceof Error ? cause.message : "Payment verification failed."} Your bag is saved. Retry verification below; do not pay again. Reference: ${payment.razorpay_payment_id}`);
    } finally { unlockPayment(); }
  }

  async function startPayment() {
    if (!currentReview || paymentLock.current || confirmation || !paymentSettings?.enabled) return;
    paymentLock.current = true;
    setPaymentPending(true);
    setError("");
    paymentReview.current = currentReview;
    try {
      if (typeof window.Razorpay !== "function") throw new Error("Secure payment checkout is still loading. Please try again.");
      const result = await paymentRequest("/api/create-order", { items, customer: currentReview.customer });
      if (!mounted.current) { unlockPayment(); return; }
      if (typeof result.order_id !== "string" || typeof result.orderToken !== "string" || typeof result.key_id !== "string" ||
        typeof result.amount !== "number" || result.currency !== "INR" || result.mode !== paymentSettings.mode ||
        result.amount !== currentReview.summary.subtotalPaise) throw new Error("Payment setup response was incomplete or your bag changed. Review it again.");
      const razorpay = new window.Razorpay({
        key: result.key_id,
        amount: result.amount,
        currency: result.currency,
        name: "Asal Organics",
        description: result.mode === "test" ? "Test checkout — no real order" : "Asal Organics order",
        order_id: result.order_id,
        prefill: { name: currentReview.customer.fullName, email: currentReview.customer.email, contact: `+91${currentReview.customer.phone}` },
        theme: { color: "#2f5d3b" },
        retry: { enabled: false },
        handler: async (payment) => {
          const pendingConfirmation = {
            razorpay_payment_id: payment.razorpay_payment_id ?? "",
            razorpay_order_id: payment.razorpay_order_id ?? "",
            razorpay_signature: payment.razorpay_signature ?? "",
            orderToken: result.orderToken as string,
          };
          setConfirmation(pendingConfirmation);
          await verifyPayment(pendingConfirmation);
        },
        modal: { ondismiss: () => {
          if (!mounted.current || paymentStage.current !== "modal") return;
          setError("Payment cancelled. No order was placed; your bag is still saved.");
          unlockPayment();
        } },
      });
      modal.current = razorpay;
      razorpay.on("payment.failed", () => {
        razorpay.close();
        setError("Payment failed. No order was confirmed; your bag is still saved. Please try another payment method.");
        unlockPayment();
      });
      paymentStage.current = "modal";
      razorpay.open();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn’t start payment. Please try again.");
      unlockPayment();
    }
  }

  return <CommerceLayout step={currentReview ? 3 : 2}>
    {paymentSettings?.enabled && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive"
      onReady={() => setScriptReady(true)} onError={() => { setScriptReady(false); setError("Razorpay could not load. Check your connection or browser blocker, then refresh."); }} />}
    {paymentSuccess ? <section className="empty-bag" role="status">
      <span className="empty-bag-icon"><Check size={34} /></span>
      <h1>{paymentSuccess.mode === "test" ? "Test payment verified." : "Payment verified."}</h1>
      <p>{paymentSuccess.mode === "test" ? "No real money was charged and no fulfilment order was placed. Your bag is unchanged." : "Your order has been confirmed."}</p>
      <p>Reference: {paymentSuccess.orderId}</p>
      <Link href="/cart" className="button button-green">Back to your bag <ArrowRight size={18} /></Link>
    </section> : !ready ? <p className="commerce-loading" role="status">Preparing checkout…</p> : !items.length && !currentReview ? <EmptyBag /> : <>
      <div className="commerce-title"><h1>{currentReview ? "Review your order" : "Delivery details"}</h1></div>
      {paymentSettings?.enabled && paymentSettings.mode === "test" && <p className="commerce-alert" role="status"><strong>Razorpay test mode.</strong> Use test details only. The items subtotal is used for this sandbox payment; no real money is charged and no delivery order is placed.</p>}
      {storageWarning && <p className="commerce-alert" role="status">{storageWarning}</p>}
      {cartChanged && <p className="commerce-alert" role="status">{paymentPending || confirmation ? "Your bag changed in another tab. This payment still uses the original reviewed items and total." : "Your bag has changed. Please review it again before continuing."}</p>}
      <div className="commerce-grid checkout-grid">
        <div>
          {currentReview ? <section className="checkout-review" ref={reviewRef} tabIndex={-1} aria-label="Checkout review">
            <div className="checkout-section-heading"><span className="section-icon"><Check size={20} /></span><div><h2>Order review</h2><p>Your checkout review is ready. No order has been placed.</p></div></div>
            <div className="review-address">
              <div className="review-address-title"><h3>Delivery details</h3><button className="text-link" disabled={paymentPending || Boolean(confirmation)} onClick={() => setReview(null)}><Pencil size={14} />Edit details</button></div>
              <strong>{currentReview.customer.fullName}</strong>
              <address>{currentReview.customer.address}<br />{currentReview.customer.apartment && <>{currentReview.customer.apartment}<br /></>}{currentReview.customer.city}, {currentReview.customer.state} {currentReview.customer.pincode}<br />India</address>
              <p>{currentReview.customer.email}<br />+91 {currentReview.customer.phone}</p>
            </div>
              <div className="payment-boundary">
              <CreditCard size={25} strokeWidth={1.4} />
              <div><h3>Pay securely with Razorpay.</h3><p>Your payment is verified on our server before an order is confirmed. Your card, UPI or bank details never reach Asal.</p></div>
            </div>
            {error && <p className="form-error-banner" role="alert">{error}</p>}
            {settingsError && <div className="form-error-banner" role="alert"><p>{settingsError}</p><button type="button" className="text-link" onClick={() => setSettingsAttempt((attempt) => attempt + 1)}>Retry payment availability</button></div>}
            <button className="button button-green full-width" onClick={() => confirmation ? verifyPayment(confirmation) : startPayment()}
              disabled={paymentPending || !paymentSettings?.enabled || (!confirmation && !scriptReady)} aria-describedby="payment-caption">
              {paymentPending ? "Processing secure payment…" : confirmation ? "Retry payment verification" : settingsError ? "Payment availability could not be checked" : !paymentSettings ? "Checking payment availability…" : !paymentSettings.enabled ? "Payments not configured" : !scriptReady ? "Loading Razorpay…" : paymentSettings.mode === "test" ? "Pay with Razorpay · Test mode" : "Continue to secure payment"} <CreditCard size={18} />
            </button>
            <p id="payment-caption" className="payment-caption">{paymentSettings?.enabled
              ? "Your name, email and mobile number will be shared with Razorpay to open checkout. Never refresh or pay again while verification is pending."
              : "Payments are unavailable until the store owner configures Razorpay. Live checkout also requires approved catalogue, shipping and tax settings."}</p>
            <Link href="/cart" className="text-link back-to-bag"><ArrowLeft size={16} />Back to your bag</Link>
          </section> : <form ref={formRef} onSubmit={submit} noValidate className="checkout-form" aria-busy={pending}>
            <div className="checkout-section-heading"><span className="section-icon"><MapPin size={20} strokeWidth={1.5} /></span><div><h2>Contact &amp; delivery</h2><p>Enter your contact and delivery details.</p></div></div>
            <p className="form-privacy">Review details stay in memory until you leave. In test mode we do not store a merchant order; in live mode delivery details are saved with your order. Opening Razorpay shares your name, email and phone with the payment provider. Use test details in preview.</p>
            {error && <p className="form-error-banner" role="alert">{error}</p>}
            <fieldset disabled={pending}>
              <legend className="sr-only">Contact and delivery details</legend>
              <div className="checkout-fields">
                {fields.map(({ key, label, autoComplete, type = "text", wide, maxLength, optional }) => <div key={key} className={`checkout-field ${wide ? "field-wide" : ""}`}>
                  <label htmlFor={`checkout-${key}`}>{label}{optional && <span> (optional)</span>}</label>
                  <input id={`checkout-${key}`} name={key} type={type} autoComplete={autoComplete} maxLength={maxLength} required={!optional}
                    inputMode={key === "pincode" ? "numeric" : undefined} value={checkoutDetails[key]}
                    onChange={(event) => updateField(key, event.target.value)} aria-invalid={Boolean(errors[key])}
                    aria-describedby={errors[key] ? `${key}-error` : key === "phone" ? "phone-hint" : undefined} />
                  {key === "phone" && !errors.phone && <small id="phone-hint">Indian mobile number, with or without +91.</small>}
                  {errors[key] && <p className="field-error" id={`${key}-error`}>{errors[key]}</p>}
                </div>)}
                <div className="checkout-field">
                  <label htmlFor="checkout-state">State / union territory</label>
                  <select id="checkout-state" name="state" autoComplete="address-level1" value={checkoutDetails.state} onChange={(event) => updateField("state", event.target.value)} required aria-invalid={Boolean(errors.state)} aria-describedby={errors.state ? "state-error" : undefined}>
                    <option value="">Select a state</option>{INDIAN_STATES.map((state) => <option key={state}>{state}</option>)}
                  </select>
                  {errors.state && <p className="field-error" id="state-error">{errors.state}</p>}
                </div>
                <div className="checkout-field"><label htmlFor="checkout-country">Country</label><input id="checkout-country" name="country" value="India" readOnly /></div>
              </div>
              <div className="delivery-note"><MapPin size={18} /><p>India addresses only for now. Delivery availability, charges and tax will be confirmed before real payments are enabled.</p></div>
              <button type="submit" className="button button-green full-width">{pending ? "Checking your details…" : "Review checkout"}<ArrowRight size={18} /></button>
            </fieldset>
            <Link href="/cart" className="text-link back-to-bag"><ArrowLeft size={16} />Back to your bag</Link>
          </form>}
        </div>
        <OrderSummary summary={currentReview?.summary ?? summary} showItems>
          <Link href="/cart" className="text-link summary-edit"><Pencil size={14} />Edit your bag</Link>
        </OrderSummary>
      </div>
      <p className="commerce-reference">Asal checkout preview · No order is placed and no inventory is reserved.</p>
    </>}
  </CommerceLayout>;
}
