import Storefront from "@/components/Storefront";
import { homeDescription, homeTitle, publicPageMetadata, serializeJsonLd, websiteStructuredData } from "@/lib/seo";

export const metadata = publicPageMetadata(homeTitle, homeDescription, "/");

export default function Home() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteStructuredData) }} />
    <Storefront />
  </>;
}
