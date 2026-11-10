"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { categoryImages } from "@/content/category-images";
import { productCategories, type Category, type ProductCategory } from "@/content/products";

export function CategorySelector({ category, onCategory, dialog = false }: {
  category: Category;
  onCategory: (category: ProductCategory) => void;
  dialog?: boolean;
}) {
  const stripRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (dialog) return;
    const strip = stripRef.current;
    const selected = strip?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    if (!strip || !selected) return;
    const bounds = strip.getBoundingClientRect();
    const button = selected.getBoundingClientRect();
    // Keep selections made in the modal/footer visible without scrolling the page.
    if (button.left < bounds.left || button.right > bounds.right) {
      strip.scrollLeft += button.left - bounds.left - 4;
    }
  }, [category, dialog]);

  return <div className="category-picker">
    <nav ref={stripRef} className={`category-shortcuts${dialog ? " category-shortcuts-dialog" : ""}`} aria-label="Shop by category">
      {productCategories.map(({ id, label, tamilLabel }) => (
        <button key={id} type="button" className="category-shortcut" onClick={() => onCategory(id)} aria-pressed={category === id} aria-controls="collection">
          <span className="category-shortcut-photo"><img src={categoryImages[id]} alt="" width="800" height="800" loading="lazy" decoding="async" /></span>
          <span className="category-shortcut-caption"><strong>{label}</strong><span lang="ta">{tamilLabel}</span></span>
        </button>
      ))}
    </nav>
    {!dialog && <p className="category-scroll-hint">Scroll to browse <ArrowRight size={13} aria-hidden="true" /></p>}
  </div>;
}
