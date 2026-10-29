"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CreditCard, MapPin, Pencil } from "lucide-react";
import { INDIAN_STATES, validateCheckoutDetails, type CheckoutDetails, type CheckoutErrors, type CheckoutReview } from "@/lib/checkout";
import { isRecord } from "@/lib/cart";
import { CommerceLayout, EmptyBag, OrderSummary } from "./CommerceLayout";
import { useCart } from "./CartProvider";

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
  const { ready, items, summary, storageWarning, checkoutDetails, setCheckoutDetails } = useCart();
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [review, setReview] = useState<{ data: CheckoutReview; cartKey: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const reviewRef = useRef<HTMLElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const cartKey = JSON.stringify(items);
  const currentReview = review?.cartKey === cartKey ? review.data : null;
  const cartChanged = review !== null && !currentReview;

  useEffect(() => () => requestRef.current?.abort(), []);
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

  return <CommerceLayout step={currentReview ? 3 : 2}>
    {!ready ? <p className="commerce-loading" role="status">Preparing checkout…</p> : !items.length ? <EmptyBag /> : <>
      <div className="commerce-title"><h1>{currentReview ? <>One last <em>look.</em></> : <>A little closer to <em>home.</em></>}</h1><p>{currentReview ? "Check your details and the essentials in your bag." : "Let’s get your everyday essentials ready."}</p></div>
      {storageWarning && <p className="commerce-alert" role="status">{storageWarning}</p>}
      {cartChanged && <p className="commerce-alert" role="status">Your bag has changed. Please review it again before continuing.</p>}
      <div className="commerce-grid checkout-grid">
        <div>
          {currentReview ? <section className="checkout-review" ref={reviewRef} tabIndex={-1} aria-label="Checkout review">
            <div className="checkout-section-heading"><span className="section-icon"><Check size={20} /></span><div><h2>Details, checked.</h2><p>Your checkout review is ready. No order has been placed.</p></div></div>
            <div className="review-address">
              <div className="review-address-title"><h3>Delivery details</h3><button className="text-link" onClick={() => setReview(null)}><Pencil size={14} />Edit details</button></div>
              <strong>{currentReview.customer.fullName}</strong>
              <address>{currentReview.customer.address}<br />{currentReview.customer.apartment && <>{currentReview.customer.apartment}<br /></>}{currentReview.customer.city}, {currentReview.customer.state} {currentReview.customer.pincode}<br />India</address>
              <p>{currentReview.customer.email}<br />+91 {currentReview.customer.phone}</p>
            </div>
            <div className="payment-boundary">
              <CreditCard size={25} strokeWidth={1.4} />
              <div><h3>Payment is the next chapter.</h3><p>Razorpay isn’t connected yet. Your bag stays saved, but no payment can be collected and no order has been placed.</p></div>
            </div>
            <button className="button button-green full-width" disabled aria-describedby="payment-unavailable">Payment coming soon <CreditCard size={18} /></button>
            <p id="payment-unavailable" className="payment-caption">Payment will open after Razorpay, delivery and tax settings are configured.</p>
            <Link href="/cart" className="text-link back-to-bag"><ArrowLeft size={16} />Back to your bag</Link>
          </section> : <form ref={formRef} onSubmit={submit} noValidate className="checkout-form" aria-busy={pending}>
            <div className="checkout-section-heading"><span className="section-icon"><MapPin size={20} strokeWidth={1.5} /></span><div><h2>Where’s home?</h2><p>Enter your contact and delivery details.</p></div></div>
            <p className="form-privacy">Details are used only for this review and aren’t saved on our server. Refreshing clears them. Please use test details while this store is in preview.</p>
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
              <div className="delivery-note"><MapPin size={18} /><p>India addresses only for now. Delivery availability, charges and tax will be confirmed before payments are enabled.</p></div>
              <button type="submit" className="button button-green full-width">{pending ? "Checking your details…" : "Review checkout"}<ArrowRight size={18} /></button>
            </fieldset>
            <Link href="/cart" className="text-link back-to-bag"><ArrowLeft size={16} />Back to your bag</Link>
          </form>}
        </div>
        <OrderSummary summary={currentReview?.summary ?? summary} showItems>
          <Link href="/cart" className="text-link summary-edit"><Pencil size={14} />Edit your bag</Link>
        </OrderSummary>
      </div>
      <p className="commerce-reference">Asal checkout preview · Aishwaryam Oils reference catalogue · No inventory is reserved.</p>
    </>}
  </CommerceLayout>;
}
