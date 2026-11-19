"use client";

import { ArrowUpRight, RotateCcw, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import {
  calculateCustomMasala, masalaIngredients,
} from "@/lib/custom-masala";
import { formatMoneyPaise } from "@/lib/checkout-pricing";
import "./custom-masala.css";
export function CustomMasalaMenu({ quantities, onQuantities, otherIngredients, onOtherIngredients, onReset, onContinue }: {
  quantities: Record<string, string>;
  onQuantities: (quantities: Record<string, string>) => void;
  otherIngredients: string;
  onOtherIngredients: (note: string) => void;
  onReset: () => void;
  onContinue: () => void;
}) {
  const quote = calculateCustomMasala(quantities);
  const canContinue = quote.totalPaise !== null && (quote.totalGrams > 0 || otherIngredients.trim().length > 0);
  return <div className="custom-masala-menu">
    <header className="custom-masala-header">
      <div>
        <span className="custom-masala-eyebrow"><SlidersHorizontal size={15} /> Your recipe. Your blend.</span>
        <h2 id="custom-masala-menu-title">Customised Masala</h2>
        <p>Choose your ingredients and let us grind them together.</p>
      </div>
      <span className="custom-masala-grinding">Freshly ground <strong>₹30 / kg</strong></span>
    </header>
    <div className="custom-masala-body">
      <div>
        <div className="custom-masala-input-heading">
          <p>Quantities in grams <span>· All fields optional</span></p>
          <button type="button" className="custom-masala-reset" onClick={onReset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="custom-masala-ingredients">
          {masalaIngredients.map(({ id, name, pricePer100g }) => <div className="custom-masala-ingredient" key={id}>
            <label htmlFor={`masala-${id}`}>{name}</label>
            <span className="custom-masala-rate">₹{pricePer100g} / 100 g</span>
            <div className={`custom-masala-quantity ${quote.errors[id] ? "has-error" : ""}`}>
              <input id={`masala-${id}`} type="text" inputMode="decimal" autoComplete="off"
                data-autofocus={id === "coriander" ? true : undefined} maxLength={8} placeholder="0" value={quantities[id] ?? ""}
                aria-label={`${name} quantity in grams`} aria-invalid={Boolean(quote.errors[id])}
                aria-describedby={quote.errors[id] ? `masala-${id}-error` : undefined}
                onChange={(event) => onQuantities({ ...quantities, [id]: event.target.value })} />
              <span aria-hidden="true">g</span>
            </div>
            {quote.errors[id] && <p className="custom-masala-error" id={`masala-${id}-error`}>{quote.errors[id]}</p>}
          </div>)}
        </div>
      </div>
      <aside className="custom-masala-summary" aria-label="Custom masala price summary">
        <p className="custom-masala-summary-label">Your blend</p>
        <dl aria-live="polite" aria-atomic="true">
          <div className="custom-masala-weight"><dt>Total quantity</dt><dd>{quote.totalGrams} <span>g</span></dd></div>
          <div><dt>Ingredients</dt><dd>{formatMoneyPaise(quote.ingredientsPaise)}</dd></div>
          <div><dt>Grinding <span>₹30/kg</span></dt><dd>{formatMoneyPaise(quote.grindingPaise)}</dd></div>
          <div className="custom-masala-total"><dt>Total price</dt><dd>{quote.totalPaise === null ? "—" : formatMoneyPaise(quote.totalPaise)}</dd></div>
        </dl>
        {quote.totalPaise === null
          ? <p className="custom-masala-error" role="status">Check the highlighted quantities for an accurate total.</p>
          : <p className="custom-masala-note">GST included. Other items and delivery quoted in chat.</p>}
        <div className="custom-masala-other">
          <label htmlFor="masala-other-ingredients">Other ingredients <span>(optional)</span></label>
          <textarea id="masala-other-ingredients" maxLength={1000} rows={3}
            placeholder="e.g. Pepper 50 g, cloves 10 g" value={otherIngredients}
            onChange={(event) => onOtherIngredients(event.target.value)} />
          <p>This note will be saved with your checkout request. WhatsApp-only edits won’t sync back to admin.</p>
        </div>
        {canContinue ? <Link href="/checkout?custom=masala" onClick={onContinue}
          className="button button-green custom-masala-whatsapp">
          Continue to checkout <ArrowUpRight size={18} />
        </Link> : <button type="button" disabled className="button button-green custom-masala-whatsapp">
          Continue to checkout <ArrowUpRight size={18} />
        </button>}
        <p className="custom-masala-draft-note">Enter your address at checkout, save your custom request, then open WhatsApp. No payment or message is sent automatically.</p>
      </aside>
    </div>
  </div>;
}
