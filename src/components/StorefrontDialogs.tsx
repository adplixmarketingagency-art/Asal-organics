"use client";

import { BrandWordmark } from "./BrandWordmark";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Heart, Leaf, Search, ShoppingBag } from "lucide-react";
import { canAddToBag, categoryLabel, formatPrice, getProductVariant, productCategories, productPackSizes, productVariantsFor, products, quantityLabel, selectProducts, type Product, type ProductCategory } from "@/content/products";
import { Modal } from "./Modal";
import { useCart } from "./CartProvider";
import { productPath } from "@/lib/product-pages";
import { ProductImage } from "./ProductImage";

export type DialogState = { type: "search" | "guide" | "ordering" | "about" } | { type: "product"; product: Product } | null;

function ProductResults({ items, onExplore }: { items: Product[]; onExplore: (product: Product) => void }) {
  return <div className="search-results">
    {items.map((product) => <button key={product.id} onClick={() => onExplore(product)}>
      <ProductImage productId={product.id} compact className="search-image-space" />
      <span><strong>{product.name}</strong><small lang="ta">{product.tamilName}</small><small>{quantityLabel(product)}</small></span>
      <span className="search-price">{canAddToBag(product) ? formatPrice(product.price) : "Price pending"}</span><ArrowUpRight size={18} />
    </button>)}
  </div>;
}

function CatalogueGuide({ onExplore }: { onExplore: (product: Product) => void }) {
  const [category, setCategory] = useState<ProductCategory>("oils");
  return <>
    <h2>Shop by category</h2>
    <div className="guide-options">
      {productCategories.map(({ id, label }) => <button key={id} className={category === id ? "selected" : ""} aria-pressed={category === id} onClick={() => setCategory(id)}>{label}</button>)}
    </div>
    <ProductResults items={selectProducts(products, { category })} onExplore={onExplore} />
  </>;
}

function SearchContent({ onExplore }: { onExplore: (product: Product) => void }) {
  const [query, setQuery] = useState("");
  const results = selectProducts(products, { query });
  return <>
    <h2>Search products</h2>
    <label className="search-input"><Search size={21} /><input data-autofocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “ghee” or “rice”" aria-label="Search products" /></label>
    <p className="search-result-label" role="status">{query ? `${results.length} matching ${results.length === 1 ? "product" : "products"}` : "All products"}</p>
    <ProductResults items={results} onExplore={onExplore} />
    {!results.length && <div className="search-empty"><Leaf size={28} /><p>No products found. Try another name or category.</p><button className="text-link" onClick={() => setQuery("")}>Clear search <ArrowRight size={16} /></button></div>}
  </>;
}

export function StorefrontDialogs({ dialog, onClose, onExplore, saved, onSave }: {
  dialog: NonNullable<DialogState>;
  onClose: () => void;
  onExplore: (product: Product) => void;
  saved: string[];
  onSave: (id: string) => void;
}) {
  const { addItem, ready } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string>();
  if (dialog.type === "product") {
    const { product } = dialog;
    const variants = productVariantsFor(product);
    const variant = getProductVariant(product.id, selectedVariantId) ?? getProductVariant(product.id);
    return <Modal title={product.name} onClose={onClose} className="product-modal">
      <ProductImage productId={product.id} className="detail-image-space" />
      <div className="detail-content">
        <p className="eyebrow">{categoryLabel(product.category)}</p><h2>{product.name}</h2>
        {product.tamilName && <p className="modal-intro" lang="ta">{product.tamilName}</p>}
        <div className="detail-price" aria-live="polite"><strong>{variant ? formatPrice(variant.price) : "Price pending"}</strong><span>{variant?.size ?? quantityLabel(product)}</span></div>
        <fieldset className="detail-packs"><legend>Choose your pack</legend><div className="pack-options">
          {variants.length ? variants.map((pack) => <label key={pack.id} className={`pack-option ${pack.id === variant?.id ? "selected" : ""}`}>
            <input type="radio" name={`pack-${product.id}`} value={pack.id} checked={pack.id === variant?.id} onChange={() => setSelectedVariantId(pack.id)} />
            <span><strong>{pack.size}</strong><small>{formatPrice(pack.price)}</small></span>
          </label>) : productPackSizes(product).map((size) => <div className="pack-option pending" key={size}><span><strong>{size}</strong><small>Price pending</small></span></div>)}
        </div></fieldset>
        <p className="detail-description">{variant ? "Pack prices are proportional to the listed litre or kilogram price, rounded up to the next whole rupee." : "500 g and 1 kg packs are listed. The base quantity for pricing needs confirmation; this item cannot be added to your bag yet."}</p>
        <Link href={productPath(product)} className="text-link detail-save" onClick={onClose}>Full product details <ArrowUpRight size={16} /></Link>
        <button className="button button-green full-width" disabled={!ready || !variant} onClick={() => { addItem(product.id, variant?.id); onClose(); }}><ShoppingBag size={18} />{variant ? `Add ${variant.size} to bag` : "Pack price to be confirmed"}<ArrowRight size={18} /></button>
        <button className="text-link detail-save" aria-pressed={saved.includes(product.id)} onClick={() => onSave(product.id)}><Heart size={16} fill={saved.includes(product.id) ? "currentColor" : "none"} />{saved.includes(product.id) ? "Saved to your favourites" : "Save to your favourites"}</button>
        <div className="preview-notice"><p>You can prepare your bag and review checkout. Real payments and delivery orders are not yet available. Sandbox checkout may be enabled for testing.</p></div>
      </div>
    </Modal>;
  }
  return <Modal title={dialog.type === "search" ? "Search products" : dialog.type === "guide" ? "Catalogue guide" : dialog.type === "about" ? "About Asal" : "Online ordering"} onClose={onClose} className={dialog.type === "guide" ? "guide-modal" : ""}>
    {dialog.type === "search" && <SearchContent onExplore={onExplore} />}
    {dialog.type === "guide" && <CatalogueGuide onExplore={onExplore} />}
    {dialog.type === "ordering" && <div className="simple-dialog"><span className="modal-symbol"><ShoppingBag size={28} strokeWidth={1.4} /></span><h2>Ordering &amp; delivery</h2><p>Add products with a listed quantity to your bag and review your delivery details at checkout.</p><p className="muted">Real payments and delivery orders are not yet available. Sandbox checkout may be enabled for testing. Delivery availability, charges and tax settings are still to be confirmed.</p><Link href="/cart" className="button button-green" onClick={onClose}>Go to your bag <ArrowRight size={18} /></Link></div>}
    {dialog.type === "about" && <div className="simple-dialog"><span className="brand modal-brand"><BrandWordmark /></span><h2>About Asal</h2><p>Asal Iyarkai Angadi offers oils, ghee, spices, dairy products and traditional grains.</p><p className="muted">Browse the catalogue and prepare your bag. Online ordering is not yet available.</p><button className="button button-green" onClick={onClose}>Back to the collection <ArrowRight size={18} /></button></div>}
  </Modal>;
}
