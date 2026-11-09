export function HeritageIllustration({ subject }: { subject: "chekku" | "bilona" | "cattle" }) {
  const path = `/images/heritage/${subject}`;
  return <picture className={`category-backdrop category-backdrop-${subject}`} aria-hidden="true">
    <source media="(max-width: 700px)" srcSet={`${path}-mobile.webp`} width="640" height="640" />
    <img
      src={`${path}-640.webp`}
      srcSet={`${path}-640.webp 640w, ${path}-1200.webp 1200w`}
      sizes="(max-width: 700px) 100vw, (max-width: 1200px) 90vw, 1120px"
      width="2528" height="1696"
      loading="lazy" decoding="async"
      alt=""
    />
  </picture>;
}
