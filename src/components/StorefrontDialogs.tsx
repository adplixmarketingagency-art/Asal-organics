"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Droplets, Heart, Leaf, Search, ShoppingBag, Sparkles } from "lucide-react";
import { formatPrice, products, selectProducts, type Product } from "@/content/products";
import { Modal } from "./Modal";
import { useCart } from "./CartProvider";

export type DialogState = { type: "search" | "guide" | "ordering" | "about" } | { type: "product"; product: Product } | null;

function OilGuide({ onExplore }: { onExplore: (product: Product) => void }) {
  const [choice, setChoice] = useState<"everyday" | "flavour" | "care">("everyday");
  const recommendations = {
    everyday: { product: products[1], reason: "An easy place to begin. Groundnut oil’s mellow, nutty flavour makes it a versatile choice for familiar everyday recipes." },
    flavour: { product: products[0], reason: "For food with a little more character. Sesame oil brings a rich, nutty flavour to traditional tempering, pickles, and South Indian favourites." },
    care: { product: products[5], reason: "A gentle starting point for a topical care routine. Check the ingredient label, avoid with a nut allergy, and patch-test before use." },
  };
  const recommendation = recommendations[choice];
  return <>
    <span className="modal-symbol"><SproutIcon /></span><p className="eyebrow">THE ASAL OIL GUIDE</p>
    <h2>Find your kind of goodness.</h2><p className="modal-intro">What does your everyday need a little more of?</p>
    <div className="guide-options">
      {([
        ["everyday", "Everyday cooking", Leaf],
        ["flavour", "Traditional flavour", Droplets],
        ["care", "Hair & body care", Sparkles],
      ] as const).map(([value, label, Icon]) => <button key={value} className={choice === value ? "selected" : ""} aria-pressed={choice === value} onClick={() => setChoice(value)}><Icon size={19} />{label}{choice === value && <Check size={16} />}</button>)}
    </div>
    <div className="guide-recommendation" aria-live="polite">
      <Image src={recommendation.product.image} alt={recommendation.product.name} width={180} height={180} />
      <div><span className="eyebrow">A GOOD PLACE TO START</span><h3>{recommendation.product.name}</h3><p>{recommendation.reason}</p><button className="text-link" onClick={() => onExplore(recommendation.product)}>Explore this oil <ArrowRight size={18} /></button></div>
    </div>
  </>;
}

function SproutIcon() { return <Leaf size={27} strokeWidth={1.4} />; }

function SearchContent({ onExplore }: { onExplore: (product: Product) => void }) {
  const [query, setQuery] = useState("");
  const results = selectProducts(products, { query });
  return <>
    <p className="eyebrow">A LITTLE DISCOVERY</p><h2>What are you looking for?</h2>
    <label className="search-input"><Search size={21} /><input data-autofocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “coconut” or “everyday”" aria-label="Search oils" /></label>
    <p className="search-result-label" role="status">{query ? `${results.length} matching ${results.length === 1 ? "oil" : "oils"}` : "Explore the collection"}</p>
    <div className="search-results">
      {results.map((product) => <button key={product.id} onClick={() => onExplore(product)}><Image src={product.image} alt="" width={70} height={70} /><span><strong>{product.name}</strong><small>{product.size} · {product.note}</small></span><span className="search-price">{formatPrice(product.price)}</span><ArrowUpRight size={18} /></button>)}
      {!results.length && <div className="search-empty"><Leaf size={28} /><p>No oils found. Try “sesame”, “groundnut”, or “coconut”.</p><button className="text-link" onClick={() => setQuery("")}>Clear search <ArrowRight size={16} /></button></div>}
    </div>
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
      <div className="detail-image"><Image src={product.image} alt={`Aishwaryam ${product.name}, reference product`} width={720} height={720} sizes="(max-width: 700px) 90vw, 420px" /><span>REFERENCE PRODUCT PHOTOGRAPHY</span></div>
      <div className="detail-content"><p className="eyebrow">{product.note}</p><h2>{product.name}</h2><p className="modal-intro">{product.subtitle}</p>
        <div className="detail-price"><strong>{formatPrice(product.price)}</strong><del>{formatPrice(product.originalPrice)}</del><span>{product.size}</span></div>
        <p className="detail-description">{product.description}</p>
        <div className="detail-facts"><span><Leaf size={17} />{product.category === "cooking" ? "Kitchen essentials" : "Hair & body care"}</span><span><Droplets size={17} />{product.size} bottle</span></div>
        <button className="button button-green full-width" disabled={!ready} onClick={() => { addItem(product.id); onClose(); }}><ShoppingBag size={18} />Add to bag <ArrowRight size={18} /></button>
        <button className="text-link detail-save" aria-pressed={saved.includes(product.id)} onClick={() => onSave(product.id)}><Heart size={16} fill={saved.includes(product.id) ? "currentColor" : "none"} />{saved.includes(product.id) ? "Saved to your favourites" : "Save to your favourites"}</button>
        <div className="preview-notice"><strong>A little note before you explore</strong><p>Product photography and indicative prices belong to Aishwaryam Oils, not Asal. You can prepare your bag and review checkout; payment and order placement are not enabled.</p><a className="text-link" href={product.source} target="_blank" rel="noreferrer">View original product <ArrowUpRight size={15} /></a></div>
      </div>
    </Modal>;
  }
  return <Modal title={dialog.type === "search" ? "Search oils" : dialog.type === "guide" ? "Oil guide" : dialog.type === "about" ? "About Asal" : "Online ordering"} onClose={onClose} className={dialog.type === "guide" ? "guide-modal" : ""}>
    {dialog.type === "search" && <SearchContent onExplore={onExplore} />}
    {dialog.type === "guide" && <OilGuide onExplore={onExplore} />}
    {dialog.type === "ordering" && <div className="simple-dialog"><span className="modal-symbol"><ShoppingBag size={28} strokeWidth={1.4} /></span><p className="eyebrow">YOUR EVERYDAY ESSENTIALS</p><h2>A little goodness, in your bag.</h2><p>Add oils to your bag, choose quantities, and review your delivery details at checkout.</p><p className="muted">This is still a reference catalogue. Razorpay payments, order placement, delivery charges and tax settings are not enabled yet.</p><Link href="/cart" className="button button-green" onClick={onClose}>Go to your bag <ArrowRight size={18} /></Link></div>}
    {dialog.type === "about" && <div className="simple-dialog"><span className="brand modal-brand"><span className="brand-word brand-word-tamil" lang="ta">அசல்<span>®</span></span><span className="brand-tagline">Asal Organics</span></span><p className="eyebrow">BACK TO WHAT’S REAL</p><h2>A simpler kind of everyday.</h2><p>Asal is a brand direction for thoughtfully chosen oils and everyday essentials. A little less complication. A little more connection to the food and rituals we love.</p><p className="muted">This website is a design preview. Business details, merchant-owned products, certifications, shipping policies, and customer support will be added before launch.</p><button className="button button-green" onClick={onClose}>Back to the collection <ArrowRight size={18} /></button></div>}
  </Modal>;
}
