import { ImageIcon } from "lucide-react";

export function ProductImagePlaceholder({ className = "", compact = false }: {
  className?: string;
  compact?: boolean;
}) {
  return <span className={`image-placeholder ${compact ? "image-placeholder-compact" : ""} ${className}`} aria-hidden="true">
    <ImageIcon size={32} strokeWidth={1} />
    {!compact && <span>Photo coming soon</span>}
  </span>;
}
