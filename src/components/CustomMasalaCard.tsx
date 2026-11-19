"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { Modal } from "./Modal";
import { CustomMasalaMenu } from "./CustomMasalaMenu";
import { calculateCustomMasala } from "@/lib/custom-masala";
import { formatMoneyPaise } from "@/lib/checkout-pricing";
import "./custom-masala.css";
import type { SavedCustomMasalaRequest } from "@/lib/custom-masala-request";

export function CustomMasalaCard() {
  const [open, setOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [otherIngredients, setOtherIngredients] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedRequest, setSavedRequest] = useState<{ key: string; data: SavedCustomMasalaRequest } | null>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const requestIdentity = useRef<{ key: string; id: string } | null>(null);
  const saveLock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const quote = calculateCustomMasala(quantities);
  const recipeKey = JSON.stringify([quantities, otherIngredients.trim()]);
  useEffect(() => () => controller.current?.abort(), []);
  async function saveRequest() {
    if (saveLock.current || quote.totalPaise === null || (!quote.totalGrams && !otherIngredients.trim())) return;
    saveLock.current = true;
    setSaving(true); setSaveError("");
    if (requestIdentity.current?.key !== recipeKey) requestIdentity.current = { key: recipeKey, id: crypto.randomUUID() };
    const abort = new AbortController();
    controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort(), 15_000);
    try {
      const response = await fetch("/api/custom-masala", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: requestIdentity.current.id, quantities, otherIngredients }),
        signal: abort.signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "The recipe could not be saved.");
      if (result.status !== "custom_request_saved" || result.id !== requestIdentity.current.id ||
        typeof result.receipt !== "string" || result.recipe?.version !== 1 || !Array.isArray(result.recipe.ingredients) ||
        !Number.isSafeInteger(result.recipe.totalPaise) || result.recipe.totalPaise < 0) {
        throw new Error("The saved recipe response was incomplete. Retry safely.");
      }
      setSavedRequest({ key: recipeKey, data: result });
    } catch (error) {
      setSaveError(error instanceof Error && error.name !== "AbortError" ? error.message : "Saving timed out. Retry safely; your recipe is still here.");
    } finally {
      window.clearTimeout(timeout); controller.current = null;
      saveLock.current = false; setSaving(false);
    }
  }
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
          <div className="product-price"><strong>{savedRequest?.key === recipeKey ? formatMoneyPaise(savedRequest.data.recipe.totalPaise)
            : quote.totalGrams && quote.totalPaise !== null ? formatMoneyPaise(quote.totalPaise) : "Your recipe"}</strong></div>
          <button type="button" className="product-add" aria-haspopup="dialog"
            onClick={(event) => { lastTrigger.current = event.currentTarget; setOpen(true); }}>
            Customise <ArrowUpRight size={15} />
          </button>
        </div>
      </div>
    </article>
    {open && <Modal title="Customised Masala" onClose={closeMenu} className="custom-masala-modal">
      <CustomMasalaMenu quantities={quantities} onQuantities={(next) => { setQuantities(next); setSaveError(""); }}
        otherIngredients={otherIngredients} onOtherIngredients={(next) => { setOtherIngredients(next); setSaveError(""); }}
        savedRequest={savedRequest?.key === recipeKey ? savedRequest.data : null}
        saving={saving} saveError={saveError} onSave={saveRequest} />
    </Modal>}
  </>;
}
