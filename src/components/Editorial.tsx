import { ArrowUpRight, Check, ChevronDown, Droplets, Flower2, Leaf, Sprout } from "lucide-react";

const faqs = [
  { question: "What makes wood-pressed oil different?", answer: "Wood pressing uses a traditional mechanical press to extract oil from seeds or nuts. The process is generally slower and uses less external heat than conventional industrial refining. Flavour, colour, and aroma vary by seed and by producer." },
  { question: "Which oil should I choose for everyday cooking?", answer: "It depends on your recipe and taste. Groundnut oil has a gently nutty flavour, sesame brings a richer character, coconut complements coastal cooking, and sunflower offers a milder option. Always follow the producer’s temperature and usage guidance." },
  { question: "How should I store my oils?", answer: "Keep the bottle tightly closed in a cool, dry place away from direct sunlight and the heat of your stove. Follow the best-before date and storage directions on the product label. Coconut oil can naturally solidify in cooler weather." },
  { question: "Can I place an order on this website?", answer: "You can add oils to your bag, adjust quantities, and review your delivery details at checkout. Order placement and Razorpay payments are not enabled yet. This preview uses reference products and photography from Aishwaryam Oils; delivery and tax settings must be confirmed before launch." },
];

export function Editorial({ onGuide }: { onGuide: () => void }) {
  return <>
    <section className="story-band" id="our-way">
      <div className="story-inner section-wrap">
        <div className="story-copy"><p className="eyebrow">OLD WISDOM. EVERYDAY GOODNESS.</p><h2>Some things are<br />better <em>left simple.</em></h2><p>A seed. A slow press. A familiar aroma.<br />Discover a traditional way of bringing more character to the food you love.</p><button className="text-link" onClick={onGuide}>Get to know your oils <ArrowUpRight size={19} /></button></div>
        <div className="process-list">
          <div><span className="process-number">01</span><div><h3>It begins with the seed.</h3><p>Groundnut, sesame, coconut, or sunflower. Every oil starts with its own natural character.</p></div><Sprout size={29} strokeWidth={1.3} /></div>
          <div><span className="process-number">02</span><div><h3>Good things aren’t rushed.</h3><p>Traditional wood pressing takes a slower, mechanical approach to extracting oil.</p></div><Droplets size={29} strokeWidth={1.3} /></div>
          <div><span className="process-number">03</span><div><h3>Let the flavour come through.</h3><p>Distinctive colours and aromas bring a little of the original ingredient to every recipe.</p></div><Flower2 size={29} strokeWidth={1.3} /></div>
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
