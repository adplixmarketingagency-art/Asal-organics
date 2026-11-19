"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowUpRight, Check, MapPin, Pencil } from "lucide-react";
import { useCart } from "./CartProvider";
import { CommerceLayout } from "./CommerceLayout";
import { CheckoutContactFields } from "./CheckoutContactFields";
import { calculateCustomMasala, savedCustomMasalaWhatsAppUrl } from "@/lib/custom-masala";
import { validateCustomMasalaCustomer, type SavedCustomMasalaRequest } from "@/lib/custom-masala-request";
import { formatMoneyPaise } from "@/lib/checkout-pricing";
import type { CheckoutDetails, CheckoutErrors } from "@/lib/checkout";
import { isRecord } from "@/lib/cart";

export function CustomMasalaCheckout() {
  const { ready, customMasalaDraft, checkoutDetails, setCheckoutDetails,
    customMasalaRequestIdentity: requestIdentity,
    customMasalaSavedRequest: savedRequest, setCustomMasalaSavedRequest: setSavedRequest } = useCart();
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const quote = calculateCustomMasala(customMasalaDraft?.quantities ?? {});
  const customer = validateCustomMasalaCustomer(checkoutDetails);
  const draftKey = JSON.stringify([
    quote.lines.map(({ ingredient, grams }) => [ingredient.id, grams]),
    customMasalaDraft?.otherIngredients.trim() ?? "", customer.details,
  ]);
  const currentSaved = savedRequest?.key === draftKey ? savedRequest.data : null;
  const displayed = currentSaved?.recipe ?? quote;
  const whatsappUrl = currentSaved ? savedCustomMasalaWhatsAppUrl(currentSaved) : null;
  const hasRecipe = customMasalaDraft && quote.totalPaise !== null &&
    (quote.totalGrams > 0 || customMasalaDraft.otherIngredients.trim().length > 0);
  useEffect(() => () => controller.current?.abort(), []);

  function updateField(key: keyof CheckoutDetails, value: string) {
    setCheckoutDetails((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (controller.current || !hasRecipe || !customMasalaDraft) return;
    setErrors(customer.errors); setError("");
    if (Object.keys(customer.errors).length) {
      setError("Please check your contact and delivery details.");
      const first = Object.keys(customer.errors)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    if (requestIdentity.current?.key !== draftKey) requestIdentity.current = { key: draftKey, id: crypto.randomUUID() };
    const abort = new AbortController();
    controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort(), 15_000);
    setPending(true);
    try {
      const response = await fetch("/api/custom-masala", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: requestIdentity.current.id, quantities: customMasalaDraft.quantities,
          otherIngredients: customMasalaDraft.otherIngredients, customer: customer.details,
        }),
        signal: abort.signal,
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        if (isRecord(result) && isRecord(result.fieldErrors)) setErrors(Object.fromEntries(
          Object.entries(result.fieldErrors).filter(([key, value]) => key in checkoutDetails && typeof value === "string"),
        ) as CheckoutErrors);
        throw new Error(isRecord(result) && typeof result.error === "string" ? result.error : "The request could not be saved.");
      }
      if (!isRecord(result) || result.status !== "custom_request_saved" || result.id !== requestIdentity.current.id ||
        typeof result.receipt !== "string" || !isRecord(result.recipe) || result.recipe.version !== 1 ||
        !Array.isArray(result.recipe.ingredients) || !Number.isSafeInteger(result.recipe.totalPaise) ||
        Number(result.recipe.totalPaise) < 0 || !isRecord(result.customer) || !result.customer.address) {
        throw new Error("The saved request response was incomplete. Retry safely.");
      }
      setSavedRequest({ key: draftKey, data: result as unknown as SavedCustomMasalaRequest });
    } catch (cause) {
      if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not save your request.");
      else setError("Saving timed out. Retry safely; your recipe and address are still here.");
    } finally {
      window.clearTimeout(timeout); controller.current = null; setPending(false);
    }
  }

  return <CommerceLayout step={currentSaved ? 3 : 2}>
    {!ready ? <p role="status" className="commerce-loading">Preparing checkout…</p>
      : !hasRecipe ? <section className="empty-bag">
        <h1>No custom recipe to check out</h1>
        <p>Your recipe stays in memory during this visit. Choose your ingredients again after a refresh.</p>
        <Link href="/#category-masala" className="button button-green">Customise masala <ArrowUpRight size={18} /></Link>
      </section> : <>
        <div className="commerce-title"><h1>{currentSaved ? "Custom request saved" : "Delivery details"}</h1></div>
        <div className="commerce-grid checkout-grid">
          <div>
            {currentSaved ? <section className="checkout-review" aria-label="Custom request review">
              <div className="checkout-section-heading"><span className="section-icon"><Check size={20} /></span>
                <div><h2>Request saved</h2><p>Reference: {currentSaved.receipt}</p></div>
              </div>
              <div className="review-address">
                <h3>Contact &amp; delivery</h3>
                <strong>{currentSaved.customer?.fullName}</strong>
                <address>{currentSaved.customer?.address}<br />
                  {currentSaved.customer?.apartment && <>{currentSaved.customer.apartment}<br /></>}
                  {currentSaved.customer?.city}, {currentSaved.customer?.state} {currentSaved.customer?.pincode}<br />India
                </address>
                <p>{currentSaved.customer?.phone}{currentSaved.customer?.email && <><br />{currentSaved.customer.email}</>}</p>
              </div>
              <p className="form-privacy">The owner can view your recipe and this checkout address in Admin Orders.
                This is an unpaid custom request; delivery and other-item costs still need confirmation.</p>
              {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="button button-green full-width">
                Other items / WhatsApp <ArrowUpRight size={18} />
              </a>}
              <p className="payment-caption">Opens the saved recipe as a draft. You review and send it; your address is not in the WhatsApp link.</p>
              <button type="button" className="text-link back-to-bag" onClick={() => setSavedRequest(null)}><Pencil size={16} />Edit checkout address</button>
            </section> : <form ref={formRef} onSubmit={submit} className="checkout-form" noValidate aria-busy={pending}>
              <div className="checkout-section-heading"><span className="section-icon"><MapPin size={20} /></span>
                <div><h2>Contact &amp; delivery</h2><p>Use your checkout address for this custom masala.</p></div>
              </div>
              <p className="form-privacy">These are the same address details used by regular checkout.
                Saving shares your recipe, name, phone and address with the owner. No payment is taken.</p>
              {error && <p className="form-error-banner" role="alert">{error}</p>}
              <fieldset disabled={pending}>
                <legend className="sr-only">Contact and delivery details</legend>
                <CheckoutContactFields details={checkoutDetails} errors={errors} onChange={updateField} emailOptional />
                <div className="delivery-note"><MapPin size={18} /><p>Delivery and other-item costs will be confirmed by the owner.</p></div>
                <button type="submit" className="button button-green full-width">{pending ? "Saving request…" : "Save custom request"}<ArrowUpRight size={18} /></button>
              </fieldset>
            </form>}
            <Link href="/#category-masala" className="text-link back-to-bag"><ArrowLeft size={16} />Back to your recipe</Link>
          </div>
          <aside className="order-summary" aria-label="Custom masala order summary">
            <div className="summary-heading"><h2>Customised Masala</h2></div>
            <p>{displayed.totalGrams} g · Grinding ₹30/kg</p>
            <dl className="summary-totals">
              {currentSaved ? currentSaved.recipe.ingredients.map((line) => <div key={line.id}><dt>{line.name} · {line.grams} g</dt><dd>{formatMoneyPaise(line.pricePaise)}</dd></div>)
                : quote.lines.map((line) => <div key={line.ingredient.id}><dt>{line.ingredient.name} · {line.grams} g</dt><dd>{formatMoneyPaise(line.pricePaise)}</dd></div>)}
              <div><dt>Ingredients</dt><dd>{formatMoneyPaise(displayed.ingredientsPaise)}</dd></div>
              <div><dt>Grinding</dt><dd>{formatMoneyPaise(displayed.grindingPaise)}</dd></div>
              <div className="summary-subtotal"><dt>Calculated subtotal</dt><dd>{formatMoneyPaise(displayed.totalPaise ?? 0)}</dd></div>
            </dl>
            {(currentSaved?.recipe.otherIngredients ?? customMasalaDraft.otherIngredients) && <p className="summary-disclaimer">Other ingredients: {currentSaved?.recipe.otherIngredients ?? customMasalaDraft.otherIngredients}</p>}
            <p className="summary-disclaimer">GST included. Other-item quantities/prices and delivery are quoted separately; this is not a payment total.</p>
          </aside>
        </div>
      </>}
  </CommerceLayout>;
}
