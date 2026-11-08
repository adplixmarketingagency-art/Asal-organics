"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { formatPrice, getProductVariant, productVariantsFor, type Product } from "@/content/products";
import { useCart } from "./CartProvider";

export function ProductPurchase({ product }: { product: Product }) {
  const { addItem, ready } = useCart();
  const [variantId, setVariantId] = useState(() => getProductVariant(product.id)?.id);
  const variants = productVariantsFor(product);
  const variant = getProductVariant(product.id, variantId);
  return <div className="product-page-purchase">
    {variant ? <label className="pack-select">
      <span>Choose your pack</span>
      <select aria-label={`${product.name} pack size`} value={variant.id} onChange={(event) => setVariantId(event.target.value)}>
        {variants.map((pack) => <option key={pack.id} value={pack.id}>{pack.size} · {formatPrice(pack.price)}</option>)}
      </select>
    </label> : <p>Pack prices need confirmation before this product can be added to your bag.</p>}
    <p className="product-page-price" aria-live="polite">{variant ? formatPrice(variant.price) : "Price pending"}</p>
    <button className="button button-green full-width" disabled={!ready || !variant} onClick={() => addItem(product.id, variant?.id)}>
      <ShoppingBag size={18} />{variant ? `Add ${variant.size} to bag` : "Pack price to be confirmed"}
    </button>
    <noscript><p>Enable JavaScript to prepare a bag. All pack information is available in the table.</p></noscript>
    <Link href="/cart" className="text-link">Review your bag <ArrowRight size={16} /></Link>
  </div>;
}
