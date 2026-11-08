import type { Metadata } from "next";

// Keep canonical URLs independent of preview hosts and request headers.
export const siteUrl = "https://asaliyarkaiangadi.in";
export const siteName = "Asal Iyarkai Angadi";
export const siteAlternateNames = ["Asaliyarkaiangadi", "Asal Organics", "அசல் இயற்கை அங்காடி"];
export const homeTitle = `${siteName} | Oils & Traditional Foods`;
export const homeDescription = "Explore Asal Iyarkai Angadi (Asaliyarkaiangadi): cold-pressed and wood-pressed oils, ghee, masala, milk products and traditional rice. View packs and prices.";
export const woodOilsPath = "/collections/wood-pressed-oils";
export const woodOilsDescription = "Explore wood-pressed groundnut, sesame and coconut oils at Asal Iyarkai Angadi. Compare listed prices and packs from 500 ml to 5 litres.";

export function publicPageMetadata(title: string, description: string, path: string): Metadata {
  const url = `${siteUrl}${path}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName,
      title,
      description,
      url,
      images: [{ url: `${siteUrl}/images/asal-social.png`, width: 1200, height: 630, alt: `${siteName} — oils and traditional foods` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: `${siteUrl}/images/asal-social.png`, alt: `${siteName} — oils and traditional foods` }],
    },
  };
}

// Only publish verified brand information. No invented address, certifications,
// ratings, inventory, or sale offers while checkout remains a store preview.
export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: siteName,
      alternateName: siteAlternateNames,
      url: `${siteUrl}/`,
      logo: { "@type": "ImageObject", url: `${siteUrl}/images/asal-logo.png`, width: 600, height: 240 },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: siteName,
      alternateName: siteAlternateNames,
      url: `${siteUrl}/`,
      description: homeDescription,
      inLanguage: ["en-IN", "ta-IN"],
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export const woodOilsBreadcrumbs = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: siteName, item: `${siteUrl}/` },
    { "@type": "ListItem", position: 2, name: "Wood-pressed Oils", item: `${siteUrl}${woodOilsPath}` },
  ],
};

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
