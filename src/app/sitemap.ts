import type { MetadataRoute } from "next";
import { products } from "../content/products.ts";
import { productPath } from "../lib/product-pages.ts";
import { siteUrl, woodOilsPath } from "../lib/seo.ts";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only canonical public pages; no checkout, API, filters or invented lastmod.
  return [
    { url: `${siteUrl}/` },
    { url: `${siteUrl}${woodOilsPath}` },
    ...products.map((product) => ({ url: `${siteUrl}${productPath(product)}` })),
  ];
}
