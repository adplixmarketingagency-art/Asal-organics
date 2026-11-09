import { productImages } from "@/content/product-images";
import { ProductImagePlaceholder } from "./ProductImagePlaceholder";

export function ProductImage({ productId, className = "", compact = false, priority = false }: {
  productId: string;
  className?: string;
  compact?: boolean;
  priority?: boolean;
}) {
  const image = productImages[productId];
  if (!image) return <ProductImagePlaceholder className={className} compact={compact} />;
  const path = `/images/products/${image.asset}`;
  return <span className={`product-artwork ${compact ? "product-artwork-compact" : ""} ${className}`}>
    <img
      src={`${path}-${compact ? 240 : 800}.webp`}
      srcSet={`${path}-240.webp 240w, ${path}-800.webp 800w`}
      sizes={compact ? "112px" : "(max-width: 700px) 90vw, (max-width: 1100px) 40vw, 600px"}
      alt={`Illustrative image: ${image.alt}. Not an actual product photograph.`}
      width="800" height="800"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
    />
    {!compact && <span className="product-artwork-caption">Illustrative image</span>}
  </span>;
}
