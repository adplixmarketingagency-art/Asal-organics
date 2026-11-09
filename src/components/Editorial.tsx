import { ArrowUpRight, Check, ChevronDown, Leaf } from "lucide-react";
import { KolamDivider } from "./Kolam";

const faqs = [
  { question: "What can I find in the collection?", answer: "Browse cold-pressed and wood-pressed oils, ghee, masala and grain flours, milk products, paneer, and traditional rice varieties. Each product shows its available packs and prices." },
  { question: "Which pack sizes are listed?", answer: "Oils: 500 ml, 1, 2 and 5 litres. Ghee: 200 ml, 500 ml and 1 litre. Masala: 100 g, 250 g, 500 g and 1 kg. Milk products and paneer: 200 g, 500 g and 1 kg. Rice, Ragi and Bajra: 500 g and 1 kg. Product details show which pack has a confirmed price." },
  { question: "How are different pack sizes priced?", answer: "Pack prices are proportional to the listed litre or kilogram price and rounded up to a whole rupee. Choose a pack on the product card or in its details. Ragi and Bajra remain unavailable until their base pricing quantities are confirmed." },
  { question: "Can I place an order on this website?", answer: "You can prepare your bag and review delivery details at checkout. Real payments and delivery orders are not yet available. Sandbox checkout may be enabled for testing. Delivery availability, charges and tax settings still need to be confirmed." },
];

export function Editorial({ onGuide }: { onGuide: () => void }) {
  return <>
    <section className="story-band" id="our-way">
      <div className="story-inner section-wrap">
        <figure className="story-photograph">
          <img src="/images/heritage/nammalvar.webp" alt="G. Nammalvar holding a wooden plough in a field" width="778" height="434" loading="lazy" decoding="async" />
          <figcaption>
            <strong>G. Nammalvar · 1938–2013</strong>
            <span>Photo: <a href="https://commons.wikimedia.org/wiki/File:Nammalvar.G.jpg" target="_blank" rel="noreferrer">Voiceoftamil / Wikimedia Commons</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>. Converted to WebP; uncropped.</span>
          </figcaption>
        </figure>
        <div className="story-copy">
          <p className="eyebrow">REMEMBERING A VOICE FOR THE SOIL</p>
          <h2>Rooted in the land.<br /><em>Remembered at the table.</em></h2>
          <p>G. Nammalvar was a Tamil natural-farming advocate who encouraged a closer relationship with the soil. We remember his contribution here as part of Tamil Nadu’s farming heritage.</p>
          <p className="story-tamil" lang="ta">அன்றாட உணவில், நம் பாரம்பரியம்.</p>
          <button className="text-link" onClick={onGuide}>Get to know the collection <ArrowUpRight size={19} /></button>
          <p className="story-context">An editorial remembrance, not an endorsement or affiliation.</p>
        </div>
      </div>
    </section>
    <KolamDivider className="editorial-divider" />
    <section className="faq-section section-wrap" id="questions">
      <div className="faq-intro"><p className="eyebrow">A LITTLE CLARITY</p><h2>Good questions.<br />Simple answers.</h2><span className="faq-leaf" aria-hidden="true"><Leaf size={54} strokeWidth={1} /></span></div>
      <div className="faq-list">{faqs.map(({ question, answer }) => <details key={question}><summary>{question}<ChevronDown size={19} /></summary><p>{answer}</p></details>)}</div>
    </section>
    <div className="closing-note"><Check size={16} /><span>A little closer to nature. A little closer to home.</span><Leaf size={16} /></div>
  </>;
}
