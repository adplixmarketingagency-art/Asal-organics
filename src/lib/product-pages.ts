import { productVariantsFor, type Product } from "../content/products.ts";
import { siteName, siteUrl, woodOilsPath } from "./seo.ts";

// Reuse stable catalogue IDs; pack selection never creates duplicate URLs.
export const productPath = (product: Product) => `/products/${product.id}`;

export function productDescription(product: Product) {
  const variants = productVariantsFor(product);
  const packs = variants.length
    ? `Compare ${variants.map((pack) => pack.size).join(", ")} pack prices.`
    : "500 g and 1 kg pack prices awaiting confirmation.";
  return `${product.name} at ${siteName}. ${packs} Store preview.`;
}

export function productBreadcrumbs(product: Product) {
  const pages = [
    { name: siteName, item: `${siteUrl}/` },
    ...(product.category === "wood-oils" ? [{ name: "Wood-pressed Oils", item: `${siteUrl}${woodOilsPath}` }] : []),
    { name: product.name, item: `${siteUrl}${productPath(product)}` },
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: pages.map((page, index) => ({ "@type": "ListItem", position: index + 1, ...page })),
  };
}
