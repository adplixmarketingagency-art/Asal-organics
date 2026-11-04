"use client";

import { useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronDown, Grid2X2, Heart, LayoutList, Search, SlidersHorizontal, Sprout, X } from "lucide-react";
import { products, productCategories, catalogueMaxPrice, catalogueMinPrice, selectProducts, formatPrice, type Category, type Product, type Sort } from "@/content/products";
import { ProductCard } from "./ProductCard";

const categories: { id: Category; label: string }[] = [
  { id: "all", label: "All products" },
  ...productCategories,
  { id: "saved", label: "Saved favourites" },
];

export function Catalogue({ saved, onSave, onExplore, onGuide, category, onCategory }: {
  saved: string[];
  onSave: (id: string) => void;
  onExplore: (product: Product) => void;
  onGuide: () => void;
  category: Category;
  onCategory: (category: Category) => void;
}) {
  const [sort, setSort] = useState<Sort>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(catalogueMaxPrice);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const filterToggleRef = useRef<HTMLButtonElement>(null);
  const selected = selectProducts(products, { category, sort, saved, maxPrice, query });
  const reset = () => { setQuery(""); setMaxPrice(catalogueMaxPrice); onCategory("all"); };
  // Closing unmounts the panel, so return focus to the control that owns aria-expanded.
  const closeFilters = () => { setFiltersOpen(false); filterToggleRef.current?.focus(); };

  return (
    <section className="collection section-wrap" id="collection" aria-labelledby="collection-title">
      <div className="collection-heading">
        <div><p className="eyebrow">THE ASAL COLLECTION</p><h2 id="collection-title">Goodness for your everyday.</h2></div>
        <button className="text-link guide-link" onClick={onGuide}>Browse by category <ArrowUpRight size={19} /></button>
      </div>
      <div className="collection-tabs" aria-label="Product categories">
        {categories.map(({ id, label }) => (
          <button key={id} className={category === id ? "active" : ""} aria-pressed={category === id} onClick={() => onCategory(id)}>
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
          <span className="result-count" role="status">{selected.length} {selected.length === 1 ? "product" : "products"} to discover</span>
        </div>
        <div className="sort-actions">
          <label className="sort-label"><span>Sort by:</span><select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
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
        <label className="price-filter"><span>Price up to <strong>{formatPrice(maxPrice)}</strong></span><input aria-label="Maximum price" type="range" min={catalogueMinPrice} max={catalogueMaxPrice} step="1" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} /></label>
        <div className="filter-panel-actions">
          <button type="button" className="text-link reset-filters" onClick={reset}>Reset filters</button>
          <button type="button" className="icon-button filter-close" aria-label="Close filters" onClick={closeFilters}><X size={18} /></button>
        </div>
      </div>}
      {selected.length ? <div className={`product-grid ${view === "list" ? "list-view" : ""}`}>
        {selected.map((product) => <ProductCard key={product.id} product={product} saved={saved.includes(product.id)} onSave={() => onSave(product.id)} onExplore={() => onExplore(product)} />)}

      </div> : <div className="empty-state"><Sprout size={36} strokeWidth={1.2} /><h3>{category === "saved" && saved.length === 0 ? "Keep your favourites close." : "Let’s find something else."}</h3><p>{category === "saved" && saved.length === 0 ? "Tap the heart on any product to save it here for later." : "No products match these filters. Try a different search or price."}</p><button className="button button-green" onClick={reset}>Explore all products <ArrowRight size={17} /></button></div>}
      <p className="catalogue-note">Prices are shown for the listed quantity. Ragi and Bajra quantities are still to be confirmed. Online payments and order placement are not yet available.</p>
    </section>
  );
}
