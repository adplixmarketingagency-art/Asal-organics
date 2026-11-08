import Storefront from "@/components/Storefront";
import { publicPageMetadata, serializeJsonLd, siteName, woodOilsBreadcrumbs, woodOilsDescription, woodOilsPath } from "@/lib/seo";

export const metadata = publicPageMetadata(`Wood-pressed Oils | ${siteName}`, woodOilsDescription, woodOilsPath);

export default function WoodPressedOils() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(woodOilsBreadcrumbs) }} />
    <Storefront initialCategory="wood-oils" />
  </>;
}
