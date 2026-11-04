import { ArrowUpRight, Check, ChevronDown, Droplets, Leaf, Sprout, Wheat } from "lucide-react";

const faqs = [
  { question: "What can I find in the collection?", answer: "Browse cold-pressed oils, masala and grain flours, milk products, and traditional rice varieties. Each product shows its price and the quantity where specified." },
  { question: "Are prices per kilogram or per litre?", answer: "Oils and Bilona Ghee are listed per litre. Masala flours, Bilona Butter, Palkova, Karuppu Kavuni Halwa, Paneer and rice are listed per kilogram. The quantities for Ragi and Bajra have not yet been specified." },
  { question: "Why can’t I add Ragi or Bajra to my bag?", answer: "Their prices are listed, but their quantities still need to be confirmed. These items will be available to add once the quantities are specified." },
  { question: "Can I place an order on this website?", answer: "You can prepare your bag and review delivery details at checkout. Online payments and order placement are not yet available. Delivery availability, charges and tax settings still need to be confirmed." },
];

export function Editorial({ onGuide }: { onGuide: () => void }) {
  return <>
    <section className="story-band" id="our-way">
      <div className="story-inner section-wrap">
        <div className="story-copy"><p className="eyebrow">FAMILIAR FOOD. EVERYDAY GOODNESS.</p><h2>Some things are<br />better <em>left simple.</em></h2><p>From cold-pressed oils to traditional rice, discover familiar essentials for the meals you love.</p><button className="text-link" onClick={onGuide}>Get to know the collection <ArrowUpRight size={19} /></button></div>
        <div className="process-list">
          <div><span className="process-number">01</span><div><h3>Oils for your kitchen.</h3><p>Groundnut, sesame and coconut oils, listed by the litre.</p></div><Droplets size={29} strokeWidth={1.3} /></div>
          <div><span className="process-number">02</span><div><h3>A place in your pantry.</h3><p>Masala flours, grain flours and traditional rice varieties.</p></div><Wheat size={29} strokeWidth={1.3} /></div>
          <div><span className="process-number">03</span><div><h3>Familiar favourites.</h3><p>Explore Bilona Ghee, Bilona Butter, Palkova, Karuppu Kavuni Halwa and Paneer.</p></div><Sprout size={29} strokeWidth={1.3} /></div>
        </div>
      </div>
    </section>
    <section className="faq-section section-wrap" id="questions">
      <div className="faq-intro"><p className="eyebrow">A LITTLE CLARITY</p><h2>Good questions.<br />Simple answers.</h2><span className="faq-leaf" aria-hidden="true"><Leaf size={54} strokeWidth={1} /></span></div>
      <div className="faq-list">{faqs.map(({ question, answer }) => <details key={question}><summary>{question}<ChevronDown size={19} /></summary><p>{answer}</p></details>)}</div>
    </section>
    <div className="closing-note"><Check size={16} /><span>A little closer to nature. A little closer to home.</span><Leaf size={16} /></div>
  </>;
}
