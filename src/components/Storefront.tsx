"use client";

import { BrandWordmark } from "./BrandWordmark";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronRight, Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { products, productCategories, type Category, type Product } from "@/content/products";
import { Catalogue } from "./Catalogue";
import { Editorial, NammalvarStory } from "./Editorial";
import { StorefrontDialogs, type DialogState } from "./StorefrontDialogs";
import { useCart } from "./CartProvider";
import { Kolam, KolamDivider } from "./Kolam";
import { siteName, woodOilsPath } from "@/lib/seo";

const storageKey = "asal-favourites-v1";
const mobileLayoutQuery = "(max-width: 700px)";
function subscribeToMobileLayout(onChange: () => void) {
  const query = window.matchMedia(mobileLayoutQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const getMobileLayout = () => window.matchMedia(mobileLayoutQuery).matches;
const getServerLayout = () => false;

export default function Storefront({ initialCategory = "all" }: { initialCategory?: "all" | "wood-oils" }) {
  const { summary } = useCart();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [category, setCategory] = useState<Category>(initialCategory);
  const [filterCategory, setFilterCategory] = useState<Category>(initialCategory);
  const [navigationId, setNavigationId] = useState(0);
  const isWoodOilsPage = initialCategory === "wood-oils";
  const [menuOpen, setMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const mobileLayout = useSyncExternalStore(subscribeToMobileLayout, getMobileLayout, getServerLayout);

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
  const goToCollection = (next: Category = "all") => {
    setCategory(next);
    // Category shortcuts navigate the full catalogue; only favourites filter it.
    setFilterCategory(next === "saved" ? "saved" : "all");
    setMenuOpen(false);
    setDialog(null);
    // Increment even when reselecting the current category.
    setNavigationId((id) => id + 1);
  };
  // Move the actual section so reading and keyboard order match its placement.
  const nammalvarStory = <NammalvarStory onGuide={guide} />;

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <div className="header-inner section-wrap">
        <a href="/" className="brand" aria-label={`${siteName} home`}><BrandWordmark /></a>
        <nav className="desktop-nav" aria-label="Main navigation"><a href="#collection" className="nav-active" onClick={(event) => { event.preventDefault(); goToCollection(); }}>Shop products <span className="nav-dot" /></a><a href="#our-way">The Asal way</a><button onClick={guide}>Our categories <ArrowUpRight size={13} /></button><a href="#questions">Good to know</a></nav>
        <div className="header-actions"><button className="icon-button" aria-label="Search products" onClick={() => setDialog({ type: "search" })}><Search size={21} strokeWidth={1.5} /></button><button className="icon-button header-favourites" aria-label={`Saved favourites, ${saved.length} items`} onClick={() => goToCollection("saved")}><Heart size={21} strokeWidth={1.5} />{saved.length > 0 && <span className="header-count">{saved.length}</span>}</button><span className="header-separator" /><Link href="/cart" className="bag-button" aria-label={`Your bag, ${summary.itemCount} ${summary.itemCount === 1 ? "item" : "items"}`}><span className="bag-icon"><ShoppingBag size={21} strokeWidth={1.5} />{summary.itemCount > 0 && <span className="bag-count">{summary.itemCount}</span>}</span><span>Your bag</span></Link><button className="icon-button mobile-menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></div>
      </div>
      {menuOpen && <nav id="mobile-menu" className="mobile-nav" aria-label="Mobile navigation"><button onClick={() => goToCollection()}>Shop products <ArrowRight size={18} /></button><a href="#our-way" onClick={() => setMenuOpen(false)}>The Asal way</a><button onClick={guide}>Our categories <ArrowUpRight size={18} /></button><a href="#questions" onClick={() => setMenuOpen(false)}>Good to know</a><button onClick={() => goToCollection("saved")}>Saved favourites ({saved.length}) <Heart size={18} /></button></nav>}
    </header>

    <main id="main" className="storefront-main">
      <div className="section-wrap"><nav className="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><ChevronRight size={12} /><span aria-current="page">{isWoodOilsPage ? "Wood-pressed Oils" : "Our products"}</span></nav>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-backdrop" aria-hidden="true"><img src="/images/editorial/paddy-field.webp" alt="" width="1024" height="683" fetchPriority="high" /></div>
          <div className="hero-copy">
            <p className="hero-tamil" lang="ta">அசல் இயற்கை அங்காடி</p>
            <h1 id="hero-title">{isWoodOilsPage ? "Wood-pressed" : "Asal Iyarkai"}{" "}<span className="hero-title-end"><em>{isWoodOilsPage ? "oils" : "Angadi"}</em><Kolam className="hero-kolam" /></span></h1>
            <a href="#collection" className="button button-green" onClick={(event) => { event.preventDefault(); goToCollection(initialCategory); }}>Shop products <ArrowDown size={17} /></a>
          </div>
        </section>
      </div>
      {!mobileLayout && nammalvarStory}
      <KolamDivider className="collection-divider" />
      <Catalogue saved={saved} onSave={toggleSaved} onExplore={explore} category={category} filterCategory={filterCategory} onCategory={goToCollection} navigationId={navigationId} />
      <Editorial />
      {mobileLayout && nammalvarStory}
    </main>
    <footer className="site-footer"><div className="footer-inner section-wrap"><div className="footer-brand"><a href="/" className="brand footer-brand-mark" aria-label={`${siteName} home`}><BrandWordmark /></a><p>{siteName}</p></div><div className="footer-links"><h3>Categories</h3>{productCategories.map(({ id, label }) => id === "wood-oils" ? <a key={id} href={woodOilsPath}>{label}</a> : <button key={id} onClick={() => goToCollection(id)}>{label}</button>)}</div><div className="footer-links"><h3>Information</h3><a href="#our-way">The Asal way</a><a href="#questions">Good to know</a><button onClick={() => setDialog({ type: "about" })}>About this store</button><button onClick={() => setDialog({ type: "ordering" })}>Ordering & delivery</button><a href="/credits">Image credits</a></div><div className="footer-signoff"><Kolam /></div></div><div className="footer-bottom section-wrap"><span>© 2026 {siteName}</span><span className="preview-tag"><span />Store preview</span><span className="footer-credit">Powered by <strong>Adplix Media</strong><img src="/adplix.svg" alt="" width="18" height="18" /></span></div></footer>
    <div className="sr-only" aria-live="polite">{announcement}</div>
    {announcement && <button className="save-toast" onClick={() => setAnnouncement("")} aria-label={`${announcement} Dismiss notification`}><Check size={16} /><span>{announcement}</span><X size={14} /></button>}
    {dialog && <StorefrontDialogs key={dialog.type === "product" ? dialog.product.id : dialog.type} dialog={dialog} onClose={() => setDialog(null)} onExplore={explore} saved={saved} onSave={toggleSaved} category={category} onCategory={goToCollection} />}
  </>;
}
