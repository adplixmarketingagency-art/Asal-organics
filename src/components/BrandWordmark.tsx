import { brandFlourishPath, brandLetterPaths, oilDropPath } from "@/content/brand-artwork";

/** Shared custom-drawn Tamil logo; the oil-drop pulli retains its landing point. */
export function BrandWordmark({ animateDrop = false }: { animateDrop?: boolean } = {}) {
  return <>
    <span className="brand-word brand-word-tamil" role="img" aria-label="அசல்" lang="ta">
      <svg className="brand-lettering" viewBox="0 0 3040 1240" aria-hidden="true" focusable="false" fill="currentColor">
        {brandLetterPaths.map((path, index) => <path key={index} d={path} />)}
        <path className="brand-flourish" d={brandFlourishPath} />
        <path className="brand-oil-drop" d={oilDropPath} />
      </svg>
      {animateDrop && <svg className="intro-oil-drip" viewBox="2383 10 156 240" aria-hidden="true" focusable="false" fill="currentColor">
        <path d={oilDropPath} />
      </svg>}
    </span>
    <span className="brand-tagline">Asal Organics</span>
  </>;
}
