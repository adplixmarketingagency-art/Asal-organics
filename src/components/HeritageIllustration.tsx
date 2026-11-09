const illustrations = {
  chekku: {
    label: "The wooden chekku",
    alt: "Illustration of a bullock turning a traditional wooden oil press in a shaded Tamil courtyard",
  },
  bilona: {
    label: "Traditional bilona churning",
    alt: "Illustration of hands working a rope-driven wooden churn in a terracotta pot, with butter in a brass bowl",
  },
  cattle: {
    label: "A cow and her calf",
    alt: "Illustration of a white zebu cow and calf resting beside a rural cattle shed",
  },
};

export function HeritageIllustration({ subject }: { subject: keyof typeof illustrations }) {
  const { label, alt } = illustrations[subject];
  const path = `/images/heritage/${subject}`;
  return <figure className={`catalogue-art catalogue-art-${subject}`}>
    <img
      src={`${path}-640.webp`}
      srcSet={`${path}-640.webp 640w, ${path}-1200.webp 1200w`}
      sizes={subject === "bilona" ? "(max-width: 700px) 42vw, 400px" : "(max-width: 700px) 180px, 264px"}
      width="2528" height="1696"
      loading="lazy" decoding="async"
      alt={`${alt}. AI-generated heritage artwork, not a photograph of Asal’s production.`}
    />
    <figcaption>{label}<span>AI illustration</span></figcaption>
  </figure>;
}
