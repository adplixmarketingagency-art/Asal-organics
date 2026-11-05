/** Bézier linework, redrawn from the owner's sikku kolam reference. */
export function Kolam({ className = "" }: { className?: string }) {
  return <img className={`kolam ${className}`} src="/images/kolam-sikku.svg" width="320" height="320" alt="" aria-hidden="true" draggable="false" />;
}

/** A short, self-contained ornament for major section breaks only. */
export function KolamDivider({ className = "" }: { className?: string }) {
  return <div className={`kolam-divider ${className}`} aria-hidden="true">
    <img className="kolam-divider-tail" src="/images/kolam-border.svg" width="160" height="40" alt="" draggable="false" />
    <Kolam />
    <img className="kolam-divider-tail" src="/images/kolam-border.svg" width="160" height="40" alt="" draggable="false" />
  </div>;
}
