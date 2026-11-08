import type { MetadataRoute } from "next";
import { siteUrl } from "../lib/seo.ts";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Cart and checkout remain crawlable so their noindex tags can be read.
      disallow: "/api/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
