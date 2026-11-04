"use client";

import { ArrowUpRight, Heart, Plus } from "lucide-react";
import { canAddToBag, categoryLabel, formatPrice, quantityLabel, type Product } from "@/content/products";
import { useCart } from "./CartProvider";
import { ProductImagePlaceholder } from "./ProductImagePlaceholder";

export function ProductCard({ product, saved, onSave, onExplore }: {
  product: Product;
  saved: boolean;
  onSave: () => void;
  onExplore: () => void;
}) {
  const { addItem, ready } = useCart();
  return (
    <article className="product-card" data-product={product.id}>
      <div className="product-media">
        <button className="product-media-open" onClick={onExplore} aria-label={`View ${product.name} details`}>
          <ProductImagePlaceholder />
        </button>
        <button className={`icon-button save-button ${saved ? "is-saved" : ""}`} aria-label={`${saved ? "Unsave" : "Save"} ${product.name}`} aria-pressed={saved} onClick={onSave}>
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="product-info">
        <p className="product-category">{categoryLabel(product.category)}</p>
        <h3><button onClick={onExplore}>{product.name}</button></h3>
        {product.tamilName && <p className="product-tamil" lang="ta">{product.tamilName}</p>}
        <p className="product-quantity">{quantityLabel(product)}</p>
        <div className="product-bottom">
          <div className="product-price"><strong>{formatPrice(product.price)}</strong></div>
          <button className="explore-button" onClick={onExplore} aria-label={`View ${product.name}`}><span>Details</span><ArrowUpRight size={18} /></button>
        </div>
        <button className="product-add" onClick={() => addItem(product.id)} disabled={!ready || !canAddToBag(product)} aria-label={`Add ${product.name} to bag`}>
          {canAddToBag(product) ? <>Add to bag <Plus size={15} /></> : "Quantity to be confirmed"}
        </button>
      </div>
    </article>
  );
}
