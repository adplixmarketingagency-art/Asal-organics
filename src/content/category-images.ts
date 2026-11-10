import type { ProductCategory } from "./products";

// Illustrative category artwork, not photographs of the products for sale.
export const categoryImages = {
  oils: "/images/categories/oils.webp",
  "wood-oils": "/images/categories/wood-oils.webp",
  ghee: "/images/categories/ghee.webp",
  masala: "/images/categories/masala.webp",
  milk: "/images/categories/milk.webp",
  rice: "/images/categories/rice.webp",
  grain: "/images/categories/grain.webp",
} as const satisfies Record<ProductCategory, string>;
