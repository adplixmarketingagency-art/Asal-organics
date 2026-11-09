"use client";

import { Heart, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { categoryLabel, formatPrice, getProductVariant, productVariantsFor, quantityLabel, type Product } from "@/content/products";
import { useCart } from "./CartProvider";
import { productPath } from "@/lib/product-pages";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product, saved, onSave, onExplore }: {
  product: Product;
  saved: boolean;
  onSave: () => void;
  onExplore: () => void;
}) {
  const { addItem, ready } = useCart();
  const [variantId, setVariantId] = useState(() => getProductVariant(product.id)?.id);
  const variants = productVariantsFor(product);
  const variant = getProductVariant(product.id, variantId);
  return (
    <article className="product-card" data-product={product.id}>
      <div className="product-media">
        <button className="product-media-open" onClick={onExplore} aria-label={`View ${product.name} details`}>
          <ProductImage productId={product.id} />
        </button>
        <button className={`icon-button save-button ${saved ? "is-saved" : ""}`} aria-label={`${saved ? "Unsave" : "Save"} ${product.name}`} aria-pressed={saved} onClick={onSave}>
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="product-info">
        <p className="product-category">{categoryLabel(product.category)}</p>
        <h3><Link href={productPath(product)} prefetch={false}>{product.name}</Link></h3>
        <p className="product-tamil" lang="ta">{product.tamilName}</p>
        {variant ? <label className="pack-select">
          <span>Pack size</span>
          <select aria-label={`${product.name} pack size`} value={variant.id} onChange={(event) => setVariantId(event.target.value)}>
            {variants.map((pack) => <option key={pack.id} value={pack.id}>{pack.size} · {formatPrice(pack.price)}</option>)}
          </select>
        </label> : <p className="product-quantity">{quantityLabel(product)}</p>}
        <div className="product-purchase">
          <div className="product-price"><strong aria-live="polite">{variant ? formatPrice(variant.price) : "Price pending"}</strong></div>
          <button className="product-add" onClick={() => addItem(product.id, variant?.id)} disabled={!ready || !variant} aria-label={`Add ${product.name}${variant ? ` ${variant.size}` : ""} to bag`}>
            {variant ? <>Add to bag <Plus size={15} /></> : "Unavailable"}
          </button>
        </div>
      </div>
    </article>
  );
}
