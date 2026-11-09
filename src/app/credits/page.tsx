import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandWordmark } from "@/components/BrandWordmark";
import { publicPageMetadata, siteName } from "@/lib/seo";
import "./credits.css";

export const metadata = publicPageMetadata(
  `Image credits | ${siteName}`,
  "Photography attribution and image credits for Asal Iyarkai Angadi.",
  "/credits",
);

export default function CreditsPage() {
  return <div className="credits-page">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="commerce-header section-wrap">
      <Link href="/" className="brand" aria-label={`${siteName} home`}><BrandWordmark /></Link>
      <Link href="/" className="text-link"><ArrowLeft size={16} />Back to the store</Link>
    </header>
    <main id="main" className="credits-content section-wrap">
      <h1>Image credits</h1>
      <section aria-labelledby="nammalvar-credit">
        <h2 id="nammalvar-credit">G. Nammalvar photograph</h2>
        <p>The photograph in our remembrance of G. Nammalvar is by <a href="https://commons.wikimedia.org/wiki/File:Nammalvar.G.jpg" target="_blank" rel="noreferrer">Voiceoftamil / Wikimedia Commons</a>, licensed under <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0)</a>.</p>
        <p>Converted to WebP; uncropped. The photograph remains available under the same licence. Its use does not imply endorsement or affiliation.</p>
        <a className="text-link" href="/images/heritage/nammalvar.webp">View the photograph</a>
      </section>
    </main>
  </div>;
}
