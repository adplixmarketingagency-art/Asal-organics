"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Heart, Leaf, Search, ShoppingBag } from "lucide-react";
import { canAddToBag, categoryLabel, formatPrice, productCategories, products, quantityLabel, selectProducts, type Product, type ProductCategory } from "@/content/products";
import { Modal } from "./Modal";
import { useCart } from "./CartProvider";
import { ProductImagePlaceholder } from "./ProductImagePlaceholder";

export type DialogState = { type: "search" | "guide" | "ordering" | "about" } | { type: "product"; product: Product } | null;

function ProductResults({ items, onExplore }: { items: Product[]; onExplore: (product: Product) => void }) {
  return <div className="search-results">
    {items.map((product) => <button key={product.id} onClick={() => onExplore(product)}>
      <ProductImagePlaceholder compact className="search-image-space" />
      <span><strong>{product.name}</strong><small>{quantityLabel(product)}</small></span>
      <span className="search-price">{formatPrice(product.price)}</span><ArrowUpRight size={18} />
    </button>)}
  </div>;
}

function CatalogueGuide({ onExplore }: { onExplore: (product: Product) => void }) {
  const [category, setCategory] = useState<ProductCategory>("oils");
  return <>
    <p className="eyebrow">THE ASAL COLLECTION</p><h2>A place for every essential.</h2>
    <p className="modal-intro">Browse our five product categories.</p>
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
    <p className="eyebrow">A LITTLE DISCOVERY</p><h2>What are you looking for?</h2>
    <label className="search-input"><Search size={21} /><input data-autofocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “ghee” or “rice”" aria-label="Search products" /></label>
    <p className="search-result-label" role="status">{query ? `${results.length} matching ${results.length === 1 ? "product" : "products"}` : "Explore the collection"}</p>
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
  if (dialog.type === "product") {
    const { product } = dialog;
    return <Modal title={product.name} onClose={onClose} className="product-modal">
      <ProductImagePlaceholder className="detail-image-space" />
      <div className="detail-content">
        <p className="eyebrow">{categoryLabel(product.category)}</p><h2>{product.name}</h2>
        {product.tamilName && <p className="modal-intro" lang="ta">{product.tamilName}</p>}
        <div className="detail-price"><strong>{formatPrice(product.price)}</strong><span>{quantityLabel(product)}</span></div>
        {!canAddToBag(product) && <p className="detail-description">The quantity for this listed price has not been specified. Adding this item to your bag will be available once the quantity is confirmed.</p>}
        <button className="button button-green full-width" disabled={!ready || !canAddToBag(product)} onClick={() => { addItem(product.id); onClose(); }}><ShoppingBag size={18} />{canAddToBag(product) ? "Add to bag" : "Quantity to be confirmed"}<ArrowRight size={18} /></button>
        <button className="text-link detail-save" aria-pressed={saved.includes(product.id)} onClick={() => onSave(product.id)}><Heart size={16} fill={saved.includes(product.id) ? "currentColor" : "none"} />{saved.includes(product.id) ? "Saved to your favourites" : "Save to your favourites"}</button>
        <div className="preview-notice"><p>You can prepare your bag and review checkout. Online payments and order placement are not yet available.</p></div>
      </div>
    </Modal>;
  }
  return <Modal title={dialog.type === "search" ? "Search products" : dialog.type === "guide" ? "Catalogue guide" : dialog.type === "about" ? "About Asal" : "Online ordering"} onClose={onClose} className={dialog.type === "guide" ? "guide-modal" : ""}>
    {dialog.type === "search" && <SearchContent onExplore={onExplore} />}
    {dialog.type === "guide" && <CatalogueGuide onExplore={onExplore} />}
    {dialog.type === "ordering" && <div className="simple-dialog"><span className="modal-symbol"><ShoppingBag size={28} strokeWidth={1.4} /></span><p className="eyebrow">YOUR EVERYDAY ESSENTIALS</p><h2>A little goodness, in your bag.</h2><p>Add products with a listed quantity to your bag and review your delivery details at checkout.</p><p className="muted">Online payments and order placement are not yet available. Delivery availability, charges and tax settings are still to be confirmed.</p><Link href="/cart" className="button button-green" onClick={onClose}>Go to your bag <ArrowRight size={18} /></Link></div>}
    {dialog.type === "about" && <div className="simple-dialog"><span className="brand modal-brand"><span className="brand-word brand-word-tamil" lang="ta">அசல்<span>®</span></span><span className="brand-tagline">Asal Organics</span></span><p className="eyebrow">BACK TO WHAT’S REAL</p><h2>A simpler kind of everyday.</h2><p>Explore Asal’s cold-pressed oils, masala and grain flours, milk products, and traditional rice varieties.</p><p className="muted">Browse the catalogue and prepare your bag. Online ordering is not yet available.</p><button className="button button-green" onClick={onClose}>Back to the collection <ArrowRight size={18} /></button></div>}
  </Modal>;
}
