"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Grid2X2, Heart, LayoutList, Search, SlidersHorizontal, Sprout, X } from "lucide-react";
import { products, categoryPackSizes, catalogueMaxPrice, catalogueMinPrice, selectProducts, groupProducts, formatPrice, type Category, type Product, type Sort } from "@/content/products";
import { ProductCard } from "./ProductCard";
import { HeritageIllustration } from "./HeritageIllustration";
import { CategorySelector } from "./CategorySelector";

const categories: { id: Category; label: string }[] = [
  { id: "all", label: "All products" },
  { id: "saved", label: "Saved favourites" },
];

export function Catalogue({ saved, onSave, onExplore, category, filterCategory, onCategory, navigationId }: {
  saved: string[];
  onSave: (id: string) => void;
  onExplore: (product: Product) => void;
  category: Category;
  filterCategory: Category;
  onCategory: (category: Category) => void;
  navigationId: number;
}) {
  const [sort, setSort] = useState<Sort>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(catalogueMaxPrice);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [readyNavigation, setReadyNavigation] = useState(0);
  const filterToggleRef = useRef<HTMLButtonElement>(null);
  const selected = selectProducts(products, { category: filterCategory, sort, saved, maxPrice, query });
  const groups = groupProducts(selected);
  const reset = () => { setQuery(""); setMaxPrice(catalogueMaxPrice); onCategory("all"); };
  // Closing unmounts the panel, so return focus to the control that owns aria-expanded.
  const closeFilters = () => { setFiltersOpen(false); filterToggleRef.current?.focus(); };

  // An explicit category choice must not inherit a search/price filter that hides it.
  // A separate commit ensures the destination exists before moving focus or scrolling.
  useEffect(() => {
    if (!navigationId) return;
    setQuery("");
    setMaxPrice(catalogueMaxPrice);
    setFiltersOpen(false);
    setReadyNavigation(navigationId);
  }, [navigationId]);

  useEffect(() => {
    if (!readyNavigation || readyNavigation !== navigationId) return;
    const frame = requestAnimationFrame(() => {
      const targetId = category === "all" || category === "saved" ? "collection" : `category-${category}`;
      const target = document.getElementById(targetId);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [category, navigationId, readyNavigation]);

  return (
    <section className="collection section-wrap" id="collection" tabIndex={-1} aria-labelledby="collection-title">
      <div className="collection-heading">
        <h2 id="collection-title">Shop by category</h2>
      </div>
      <CategorySelector category={category} onCategory={onCategory} />
      <div className="collection-tabs" aria-label="Collection views">
        {categories.map(({ id, label }) => (
          <button key={id} className={filterCategory === id ? "active" : ""} aria-pressed={filterCategory === id} onClick={() => onCategory(id)}>
            {id === "saved" && <Heart size={15} />}{label}
            {id === "all" && <span className="tab-count">{products.length}</span>}
            {id === "saved" && saved.length > 0 && <span className="tab-count">{saved.length}</span>}
          </button>
        ))}
      </div>
      <div className="collection-toolbar">
        <div className="filter-actions">
          <button ref={filterToggleRef} className={`filter-button ${filtersOpen ? "active" : ""}`} onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen} aria-controls="collection-filters">
            <SlidersHorizontal size={16} /> Filters {maxPrice < catalogueMaxPrice || query ? <span className="filter-dot" /> : null}<ChevronDown size={14} />
          </button>
          <span className="result-count" role="status">{selected.length} {selected.length === 1 ? "product" : "products"}</span>
        </div>
        <div className="sort-actions">
          <label className="sort-label"><span>Sort within categories:</span><select aria-label="Sort products within each category" value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
            <option value="featured">Featured</option>
            <option value="price-asc">Base pack price: low to high</option>
            <option value="price-desc">Base pack price: high to low</option>
            <option value="name">Name: A to Z</option>
          </select><ChevronDown size={14} /></label>
          <div className="view-toggle">
            <button className={`icon-button ${view === "grid" ? "active" : ""}`} aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}><Grid2X2 size={18} /></button>
            <button className={`icon-button ${view === "list" ? "active" : ""}`} aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}><LayoutList size={19} /></button>
          </div>
        </div>
      </div>
      {filtersOpen && <div className="filter-panel" id="collection-filters" onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); closeFilters(); } }}>
        <label className="filter-search"><Search size={17} /><input aria-label="Filter products by name" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the collection" /></label>
        <label className="price-filter"><span>Base pack price up to <strong>{formatPrice(maxPrice)}</strong></span><input aria-label="Maximum base pack price" type="range" min={catalogueMinPrice} max={catalogueMaxPrice} step="1" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} /></label>
        <div className="filter-panel-actions">
          <button type="button" className="text-link reset-filters" onClick={reset}>Reset filters</button>
          <button type="button" className="icon-button filter-close" aria-label="Close filters" onClick={closeFilters}><X size={18} /></button>
        </div>
      </div>}
      {selected.length ? <div className="category-sections">
        {groups.map((group) => <section className={`category-section category-section-${group.id}`} key={group.id} id={`category-${group.id}`} tabIndex={-1} aria-labelledby={`category-${group.id}-title`}>
          {group.id === "wood-oils" && <HeritageIllustration subject="chekku" />}
          {group.id === "ghee" && <HeritageIllustration subject="bilona" />}
          {group.id === "milk" && <HeritageIllustration subject="cattle" />}
          <div className="category-section-heading">
            <div className="category-heading-copy"><p className="category-tamil" lang="ta">{group.tamilLabel}</p><h3 id={`category-${group.id}-title`}>{group.label}</h3><p className="category-pack-sizes">Pack sizes: {categoryPackSizes[group.id].join(" · ")}</p></div>
            <span className="category-product-count">{group.products.length} {group.products.length === 1 ? "product" : "products"}</span>
          </div>
          <div className={`product-grid ${view === "list" ? "list-view" : ""}`}>
            {group.products.map((product) => <ProductCard key={product.id} product={product} saved={saved.includes(product.id)} onSave={() => onSave(product.id)} onExplore={() => onExplore(product)} />)}
          </div>
        </section>)}
      </div> : <div className="empty-state"><Sprout size={36} strokeWidth={1.2} /><h3>{filterCategory === "saved" && saved.length === 0 ? "No saved favourites" : "No matching products"}</h3><p>{filterCategory === "saved" && saved.length === 0 ? "Tap the heart on any product to save it here for later." : "No products match these filters. Try a different search or price."}</p><button className="button button-green" onClick={reset}>View all products <ArrowRight size={17} /></button></div>}
      <p className="catalogue-note">Filters and sorting use the base pack price. Real payments and delivery orders are not yet available.</p>
    </section>
  );
}
