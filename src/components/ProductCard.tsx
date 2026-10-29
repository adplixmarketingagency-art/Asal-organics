"use client";

import Image from "next/image";
import { ArrowUpRight, Heart, Plus } from "lucide-react";
import { formatPrice, type Product } from "@/content/products";
import { useCart } from "./CartProvider";

export function ProductCard({ product, saved, onSave, onExplore }: {
  product: Product;
  saved: boolean;
  onSave: () => void;
  onExplore: () => void;
}) {
  const { addItem, ready } = useCart();
  return (
    <article className={`product-card product-${product.id}`} data-product={product.id}>
      <div className="product-image">
        <span className="product-note">{product.note}</span>
        <button className={`icon-button save-button ${saved ? "is-saved" : ""}`} aria-label={`${saved ? "Unsave" : "Save"} ${product.name}`} aria-pressed={saved} onClick={onSave}>
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
        <button className="product-image-link" onClick={onExplore} aria-label={`View ${product.name}`}>
          <Image src={product.image} alt={`Aishwaryam ${product.name}, reference product photograph`} width={720} height={720} sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw" />
        </button>
        <span className="image-volume">{product.size}</span>
      </div>
      <div className="product-info">
        <p className="product-category">{product.category === "cooking" ? "WOOD-PRESSED GOODNESS" : "NATURAL CARE"}</p>
        <h3><button onClick={onExplore}>{product.name}</button></h3>
        <p className="product-subtitle">{product.subtitle}</p>
        <div className="product-bottom">
          <div className="product-price"><strong>{formatPrice(product.price)}</strong><del>{formatPrice(product.originalPrice)}</del></div>
          <button className="explore-button" onClick={onExplore} aria-label={`Explore ${product.name}`}><span>Explore</span><ArrowUpRight size={18} /></button>
        </div>
        <button className="product-add" onClick={() => addItem(product.id)} disabled={!ready} aria-label={`Add ${product.name} to bag`}>Add to bag <Plus size={15} /></button>
      </div>
    </article>
  );
}
