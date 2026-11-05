"use client";

import { BrandWordmark } from "./BrandWordmark";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Leaf, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { categoryLabel, formatPrice } from "@/content/products";
import { MAX_ITEM_QUANTITY, type CartSummary } from "@/lib/cart";
import { useCart } from "./CartProvider";
import { ProductImagePlaceholder } from "./ProductImagePlaceholder";

export function CommerceLayout({ step, children }: { step: 1 | 2 | 3; children: ReactNode }) {
  const { summary } = useCart();
  return <div className="commerce-page">
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="announcement-bar"><Leaf size={13} /><span>A little closer to nature. A little more goodness.</span></div>
    <header className="commerce-header section-wrap">
      <Link href="/" className="brand" aria-label="Asal Organics home"><BrandWordmark /></Link>
      <Link href="/#collection" className="text-link"><ArrowLeft size={16} />Continue shopping</Link>
      <Link href="/cart" className="commerce-bag" aria-label={`Your bag, ${summary.itemCount} ${summary.itemCount === 1 ? "item" : "items"}`}><ShoppingBag size={21} /><span>{summary.itemCount}</span></Link>
    </header>
    <main id="main" className="commerce-main section-wrap">
      <nav aria-label="Checkout progress" className="checkout-progress">
        <ol>{(["Your bag", "Delivery details", "Review"] as const).map((label, index) => <li key={label} className={step >= index + 1 ? "reached" : ""} aria-current={step === index + 1 ? "step" : undefined}>
          <span className="step-number">{step > index + 1 ? <Check size={13} /> : index + 1}</span>
          {index === 0 && step > 1 ? <Link href="/cart">{label}</Link> : <span>{label}</span>}
        </li>)}</ol>
      </nav>
      {children}
    </main>
    <footer className="commerce-footer section-wrap"><span>© 2026 Asal. Nature, uncomplicated.</span><span>Secure checkout · Powered by Razorpay</span></footer>
  </div>;
}

export function EmptyBag() {
  return <section className="empty-bag">
    <span className="empty-bag-icon"><ShoppingBag size={34} strokeWidth={1.2} /></span>
    <h1>A little goodness awaits.</h1>
    <p>Your bag is empty. Find something for your everyday<br />and make a little room for something good.</p>
    <Link href="/#collection" className="button button-green">Explore the collection <ArrowRight size={18} /></Link>
  </section>;
}

export function CartLines({ compact = false, summary: suppliedSummary }: { compact?: boolean; summary?: CartSummary }) {
  const { summary: browserSummary, updateQuantity } = useCart();
  const summary = suppliedSummary ?? browserSummary;
  return <ul className={`cart-lines ${compact ? "compact-lines" : ""}`}>
    {summary.lines.map(({ product, productId, variant, variantId, quantity, unitPricePaise, lineTotalPaise }) => <li key={variantId} className="cart-line">
      <ProductImagePlaceholder compact className="cart-image-space" />
      <div className="cart-line-description">
        {!compact && <p className="eyebrow">{categoryLabel(product.category)}</p>}
        <h3>{product.name}</h3><p className="cart-line-tamil" lang="ta">{product.tamilName}</p>
        <p>{variant.size}{compact && <> · Qty {quantity}</>}{!compact && <> · {formatPrice(unitPricePaise / 100)} each</>}</p>
        {!compact && <div className="cart-line-controls">
          <div className="quantity-control" role="group" aria-label={`${product.name} ${variant.size} quantity`}>
            <button type="button" aria-label={`Decrease ${product.name} ${variant.size} quantity`} disabled={quantity <= 1} onClick={() => updateQuantity(productId, quantity - 1, variantId)}><Minus size={14} /></button>
            <span aria-live="polite" aria-label={`${quantity} ${quantity === 1 ? "unit" : "units"}`}>{quantity}</span>
            <button type="button" aria-label={`Increase ${product.name} ${variant.size} quantity`} disabled={quantity >= MAX_ITEM_QUANTITY} onClick={() => updateQuantity(productId, quantity + 1, variantId)}><Plus size={14} /></button>
          </div>
          <button type="button" className="remove-item" aria-label={`Remove ${product.name} ${variant.size} from bag`} onClick={() => updateQuantity(productId, 0, variantId)}><Trash2 size={14} /><span>Remove</span></button>
        </div>}
      </div>
      <strong className="cart-line-total">{formatPrice(lineTotalPaise / 100)}</strong>
    </li>)}
  </ul>;
}

export function OrderSummary({ summary, children, showItems = false }: { summary: CartSummary; children?: ReactNode; showItems?: boolean }) {
  return <aside className="order-summary" aria-label="Order summary">
    <div className="summary-heading"><h2>Your everyday essentials</h2><span>{summary.itemCount} {summary.itemCount === 1 ? "item" : "items"}</span></div>
    {showItems && <CartLines compact summary={summary} />}
    <dl className="summary-totals">
      <div><dt>Items subtotal</dt><dd>{formatPrice(summary.subtotalPaise / 100)}</dd></div>
      <div><dt>Delivery</dt><dd>To be confirmed</dd></div>
      <div><dt>Tax</dt><dd>To be confirmed</dd></div>
      <div className="summary-subtotal"><dt>Estimated subtotal</dt><dd>{formatPrice(summary.subtotalPaise / 100)}</dd></div>
    </dl>
    <p className="summary-disclaimer">Prices are for the listed quantities. Delivery and tax rules must be confirmed before real payments.</p>
    {children}
    <div className="summary-footnote"><Leaf size={18} strokeWidth={1.3} /><span>A little tradition.<br />A whole lot of goodness.</span></div>
  </aside>;
}
