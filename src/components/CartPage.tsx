"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { CartLines, CommerceLayout, EmptyBag, OrderSummary } from "./CommerceLayout";
import { useCart } from "./CartProvider";

export function CartPage() {
  const { ready, summary, storageWarning } = useCart();
  return <CommerceLayout step={1}>
    {!ready ? <p className="commerce-loading" role="status">Opening your bag…</p> : !summary.lines.length ? <EmptyBag /> : <>
      <div className="commerce-title"><h1>Your bag of <em>goodness.</em></h1><p>A few good things, chosen by you.</p></div>
      {storageWarning && <p className="commerce-alert" role="status">{storageWarning}</p>}
      <div className="commerce-grid">
        <section aria-label="Items in your bag">
          <div className="cart-list-heading"><span>PRODUCT</span><span>SUBTOTAL</span></div>
          <CartLines />
          <div className="bag-note"><ShoppingBag size={18} /><p>{storageWarning ? "Your bag is available for this visit." : "Your bag is saved on this browser."} You can adjust it anytime before payment.</p></div>
        </section>
        <OrderSummary summary={summary}>
          <Link href="/checkout" className="button button-green full-width">Continue to checkout <ArrowRight size={18} /></Link>
          <p className="payment-caption">Delivery details first. No payment required.</p>
        </OrderSummary>
      </div>
      <p className="commerce-reference">Shown with Aishwaryam Oils reference products. No order is placed until a live merchant catalogue and payment service are connected.</p>
    </>}
  </CommerceLayout>;
}
