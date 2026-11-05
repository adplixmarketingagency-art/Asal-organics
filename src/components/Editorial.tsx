import { ArrowUpRight, Check, ChevronDown, Droplets, Leaf, Sprout, Wheat } from "lucide-react";
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
        <figure className="story-photograph"><img src="/images/editorial/kitchen-harvest.webp" alt="Baskets of chillies, carrots, cucumbers and bitter gourds at a vegetable market" width="1000" height="667" loading="lazy" /><figcaption>Colour, flavour, and the joy of cooking.<span>Editorial imagery, not products for sale.</span></figcaption></figure>
        <div className="story-copy"><p className="eyebrow">FAMILIAR FOOD. EVERYDAY GOODNESS.</p><h2>Some things are<br />better <em>left simple.</em></h2><p>From cold-pressed oils to traditional rice, discover familiar essentials for the meals you love.</p><p className="story-tamil" lang="ta">அன்றாட உணவில், நம் பாரம்பரியம்.</p><button className="text-link" onClick={onGuide}>Get to know the collection <ArrowUpRight size={19} /></button></div>
      </div>
      <div className="section-wrap">
        <div className="process-list">
          <div><span className="process-number">01</span><div><h3>Oils for your kitchen.</h3><p>Groundnut, sesame and coconut oils, listed by the litre.</p></div><Droplets size={29} strokeWidth={1.3} /></div>
          <div><span className="process-number">02</span><div><h3>A place in your pantry.</h3><p>Masala flours, grain flours and traditional rice varieties.</p></div><Wheat size={29} strokeWidth={1.3} /></div>
          <div><span className="process-number">03</span><div><h3>Familiar favourites.</h3><p>Explore Bilona Ghee, Bilona Butter, Palkova, Karuppu Kavuni Halwa and Paneer.</p></div><Sprout size={29} strokeWidth={1.3} /></div>
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
