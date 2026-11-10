import { ArrowUpRight, ChevronDown, Leaf } from "lucide-react";
import { KolamDivider } from "./Kolam";

const faqs = [
  { question: "Which pack sizes are available?", answer: "Use the pack selector on each product to see its sizes and prices." },
  { question: "How are pack prices calculated?", answer: "Prices are proportional to the listed litre or kilogram price and rounded up to a whole rupee." },
  { question: "Can I place an order?", answer: "Real payments and delivery orders are not yet available. You can prepare your bag and review checkout. Sandbox payments are for testing only; delivery charges and tax settings are still to be confirmed." },
];

export function NammalvarStory({ onGuide }: { onGuide: () => void }) {
  return <section className="story-band" id="our-way" aria-labelledby="nammalvar-title">
      <div className="story-inner section-wrap">
        <figure className="story-photograph">
          <img src="/images/heritage/nammalvar.webp" alt="G. Nammalvar holding a wooden plough in a field" width="778" height="434" loading="lazy" decoding="async" />
          <figcaption>
            <strong>G. Nammalvar · 1938–2013</strong>
          </figcaption>
        </figure>
        <div className="story-copy">
          <h2 id="nammalvar-title">G. Nammalvar</h2>
          <p>A Tamil natural-farming advocate, remembered for his contribution to Tamil Nadu’s farming heritage.</p>
          <p className="story-tamil" lang="ta">அன்றாட உணவில், நம் பாரம்பரியம்.</p>
          <button className="text-link" onClick={onGuide}>Shop products <ArrowUpRight size={19} /></button>
          <p className="story-context">An editorial remembrance, not an endorsement or affiliation.</p>
        </div>
      </div>
    </section>;
}

export function Editorial() {
  return <>
    <KolamDivider className="editorial-divider" />
    <section className="faq-section section-wrap" id="questions">
      <div className="faq-intro"><h2>Good to know</h2><span className="faq-leaf" aria-hidden="true"><Leaf size={54} strokeWidth={1} /></span></div>
      <div className="faq-list">{faqs.map(({ question, answer }) => <details key={question}><summary>{question}<ChevronDown size={19} /></summary><p>{answer}</p></details>)}</div>
    </section>
  </>;
}
