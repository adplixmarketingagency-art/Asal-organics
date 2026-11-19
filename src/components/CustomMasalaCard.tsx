"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { Modal } from "./Modal";
import { CustomMasalaMenu } from "./CustomMasalaMenu";
import { calculateCustomMasala } from "@/lib/custom-masala";
import { formatMoneyPaise } from "@/lib/checkout-pricing";
import { useCart } from "./CartProvider";
import "./custom-masala.css";

export function CustomMasalaCard() {
  const [open, setOpen] = useState(false);
  const { customMasalaDraft, setCustomMasalaDraft } = useCart();
  const quantities = customMasalaDraft?.quantities ?? {};
  const otherIngredients = customMasalaDraft?.otherIngredients ?? "";
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const quote = calculateCustomMasala(quantities);
  function closeMenu() {
    setOpen(false);
    lastTrigger.current?.focus();
  }
  return <>
    <article className="product-card custom-masala-card" data-product="custom-masala">
      <div className="product-media">
        <button type="button" className="product-media-open custom-masala-cover"
          aria-label="Customise masala ingredients" aria-haspopup="dialog"
          onClick={(event) => { lastTrigger.current = event.currentTarget; setOpen(true); }}>
          <span className="custom-masala-cover-symbol"><SlidersHorizontal size={35} strokeWidth={1.3} /></span>
          <span>Your own blend</span>
        </button>
      </div>
      <div className="product-info">
        <p className="product-category">Made to your recipe</p>
        <h3><button type="button" className="custom-masala-name" aria-haspopup="dialog"
          onClick={(event) => { lastTrigger.current = event.currentTarget; setOpen(true); }}>Customised Masala</button></h3>
        <p className="product-tamil" lang="ta">உங்கள் விருப்ப மசாலா</p>
        <p className="custom-masala-card-note">Choose ingredients &amp; quantities.<br />Grinding ₹30/kg.</p>
        <div className="product-purchase">
          <div className="product-price"><strong>{quote.totalGrams && quote.totalPaise !== null ? formatMoneyPaise(quote.totalPaise) : "Your recipe"}</strong></div>
          <button type="button" className="product-add" aria-haspopup="dialog"
            onClick={(event) => { lastTrigger.current = event.currentTarget; setOpen(true); }}>
            Customise <ArrowUpRight size={15} />
          </button>
        </div>
      </div>
    </article>
    {open && <Modal title="Customised Masala" onClose={closeMenu} className="custom-masala-modal">
      <CustomMasalaMenu quantities={quantities} onQuantities={(next) => setCustomMasalaDraft({ quantities: next, otherIngredients })}
        otherIngredients={otherIngredients} onOtherIngredients={(next) => setCustomMasalaDraft({ quantities, otherIngredients: next })}
        onReset={() => setCustomMasalaDraft({ quantities: {}, otherIngredients: "" })}
        onContinue={closeMenu} />
    </Modal>}
  </>;
}
