"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronRight, Droplets, Heart, Leaf, Menu, Search, ShoppingBag, Sprout, Sun, X } from "lucide-react";
import { products, type Category, type Product } from "@/content/products";
import { Catalogue } from "./Catalogue";
import { Editorial } from "./Editorial";
import { StorefrontDialogs, type DialogState } from "./StorefrontDialogs";
import { useCart } from "./CartProvider";

const storageKey = "asal-favourites-v1";

export default function Storefront() {
  const { summary } = useCart();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [category, setCategory] = useState<Category>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const loadSaved = () => {
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
        if (Array.isArray(parsed)) setSaved([...new Set(parsed.filter((id): id is string => typeof id === "string" && products.some((product) => product.id === id)))]);
      } catch { /* Browsing remains available when storage is blocked. */ }
    };
    loadSaved();
    const onStorage = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) loadSaved(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function toggleSaved(id: string) {
    const alreadySaved = saved.includes(id);
    const next = alreadySaved ? saved.filter((item) => item !== id) : [...saved, id];
    setSaved(next);
    const name = products.find((product) => product.id === id)?.name;
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setAnnouncement(`${name} ${alreadySaved ? "removed from" : "saved to"} your favourites.`);
    } catch {
      setAnnouncement(`${name} ${alreadySaved ? "removed" : "saved"} for this visit. Your browser could not save it for later.`);
    }
  }

  const explore = (product: Product) => setDialog({ type: "product", product });
  const guide = () => { setMenuOpen(false); setDialog({ type: "guide" }); };
  const goToCollection = (next: Category = "all") => { setCategory(next); setMenuOpen(false); document.getElementById("collection")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="announcement-bar"><Leaf size={13} /><span>A little closer to nature. A little more goodness.</span><a href="#our-way">Discover our way <ArrowUpRight size={13} /></a></div>
    <header className="site-header">
      <div className="header-inner section-wrap">
        <a href="/" className="brand" aria-label="Asal Organics home"><span className="brand-word brand-word-tamil" lang="ta">அசல்<span>®</span></span><span className="brand-tagline">Asal Organics</span></a>
        <nav className="desktop-nav" aria-label="Main navigation"><a href="#collection" className="nav-active" onClick={() => setCategory("all")}>Shop oils <span className="nav-dot" /></a><a href="#our-way">The Asal way</a><button onClick={guide}>Find your oil <ArrowUpRight size={13} /></button><a href="#questions">Good to know</a></nav>
        <div className="header-actions"><button className="icon-button" aria-label="Search products" onClick={() => setDialog({ type: "search" })}><Search size={21} strokeWidth={1.5} /></button><button className="icon-button header-favourites" aria-label={`Saved favourites, ${saved.length} items`} onClick={() => goToCollection("saved")}><Heart size={21} strokeWidth={1.5} />{saved.length > 0 && <span className="header-count">{saved.length}</span>}</button><span className="header-separator" /><Link href="/cart" className="bag-button" aria-label={`Your bag, ${summary.itemCount} ${summary.itemCount === 1 ? "item" : "items"}`}><span className="bag-icon"><ShoppingBag size={21} strokeWidth={1.5} />{summary.itemCount > 0 && <span className="bag-count">{summary.itemCount}</span>}</span><span>Your bag</span></Link><button className="icon-button mobile-menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></div>
      </div>
      {menuOpen && <nav id="mobile-menu" className="mobile-nav" aria-label="Mobile navigation"><button onClick={() => goToCollection()}>Shop oils <ArrowRight size={18} /></button><a href="#our-way" onClick={() => setMenuOpen(false)}>The Asal way</a><button onClick={guide}>Find your oil <ArrowUpRight size={18} /></button><a href="#questions" onClick={() => setMenuOpen(false)}>Good to know</a><button onClick={() => goToCollection("saved")}>Saved favourites ({saved.length}) <Heart size={18} /></button></nav>}
    </header>

    <main id="main">
      <div className="section-wrap"><nav className="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><ChevronRight size={12} /><span aria-current="page">Wood-pressed oils</span></nav>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy"><p className="eyebrow"><span />STRAIGHT FROM NATURE</p><h1 id="hero-title">Pure by nature.<br />Goodness in<br /><em>every drop.</em></h1><p className="hero-description">Rediscover the simple joy of wood-pressed oils.<br className="desktop-break" /> Familiar flavours. Everyday rituals. Naturally good.</p><a href="#collection" className="button button-green" onClick={() => setCategory("all")}>Explore the oils <ArrowDown size={17} /></a><div className="hero-footnote"><span className="small-leaf"><Leaf size={16} strokeWidth={1.4} /></span><span>A little tradition. A whole lot of goodness.</span></div></div>
          <div className="hero-photo"><Image src="/images/hero.jpg" alt="Golden oil in a glass cruet beside fresh olives in soft natural light" fill priority sizes="(max-width: 700px) 100vw, 50vw" /><span className="photo-caption">THE BEAUTY OF KEEPING IT SIMPLE.</span><div className="hero-seal"><span>ROOTED IN NATURE</span><Droplets size={34} strokeWidth={1.1} /><span>MADE FOR EVERYDAY</span></div></div>
        </section>
      </div>
      <div className="qualities section-wrap"><div><Sprout /><span>Traditionally wood-pressed</span></div><span className="quality-divider" /><div><Droplets /><span>Distinctive natural flavour</span></div><span className="quality-divider" /><div><Sun /><span>Everyday kitchen essentials</span></div><span className="quality-divider" /><div><Heart /><span>Goodness, kept simple</span></div></div>
      <Catalogue saved={saved} onSave={toggleSaved} onExplore={explore} onGuide={guide} category={category} onCategory={setCategory} />
      <Editorial onGuide={guide} />
    </main>
    <footer className="site-footer"><div className="footer-inner section-wrap"><div className="footer-brand"><a href="/" className="brand footer-brand-mark" aria-label="Asal Organics home"><span className="brand-word brand-word-tamil" lang="ta">அசல்<span>®</span></span><span className="brand-tagline">Asal Organics</span></a><p>Nature, uncomplicated.<br />Goodness, every day.</p><span className="footer-leaf"><Leaf size={17} /> Back to what’s real.</span></div><div className="footer-links"><h3>Find your goodness</h3><button onClick={() => goToCollection()}>All oils</button><button onClick={() => goToCollection("cooking")}>Everyday cooking</button><button onClick={() => goToCollection("care")}>Hair & body</button><button onClick={guide}>The oil guide</button></div><div className="footer-links"><h3>A little about us</h3><a href="#our-way">The Asal way</a><a href="#questions">Good to know</a><button onClick={() => setDialog({ type: "about" })}>About this store</button><button onClick={() => setDialog({ type: "ordering" })}>Ordering & delivery</button></div><div className="footer-signoff"><Sprout size={34} strokeWidth={1.2} /><p>Good food.<br />Simple rituals.<br /><em>A little more real.</em></p></div></div><div className="footer-bottom section-wrap"><span>© 2026 Asal. A fresh beginning.</span><span>Thoughtfully designed. Rooted in nature.</span><span className="preview-tag"><span />Store preview</span></div></footer>
    <div className="sr-only" aria-live="polite">{announcement}</div>
    {announcement && <button className="save-toast" onClick={() => setAnnouncement("")} aria-label={`${announcement} Dismiss notification`}><Check size={16} /><span>{announcement}</span><X size={14} /></button>}
    {dialog && <StorefrontDialogs key={dialog.type === "product" ? dialog.product.id : dialog.type} dialog={dialog} onClose={() => setDialog(null)} onExplore={explore} saved={saved} onSave={toggleSaved} />}
  </>;
}
