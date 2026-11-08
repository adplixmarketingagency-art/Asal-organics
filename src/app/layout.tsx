import type { Metadata } from "next";
import localFont from "next/font/local";
import { CartProvider } from "@/components/CartProvider";
import { BrandIntro } from "@/components/BrandIntro";
import { homeDescription, homeTitle, siteName, siteUrl } from "@/lib/seo";
import "./globals.css";
import "./commerce.css";
import "./heritage.css";

const manrope = localFont({
  src: [{ path: "../../public/fonts/manrope-variable.ttf", weight: "200 800" }],
  variable: "--font-sans",
  display: "swap",
});
const lora = localFont({
  src: [
    { path: "../../public/fonts/lora-variable.ttf", weight: "400 700", style: "normal" },
    { path: "../../public/fonts/lora-italic-variable.ttf", weight: "400 700", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
});
const tamil = localFont({
  src: [{ path: "../../public/fonts/noto-sans-tamil-variable.ttf", weight: "100 900" }],
  variable: "--font-tamil",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: { default: homeTitle, template: `%s | ${siteName}` },
  description: homeDescription,
  robots: { index: true, follow: true, "max-image-preview": "large" },
  icons: {
    icon: { url: "/brand-icon.png", type: "image/png", sizes: "96x96" },
    apple: { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
  },
  // URL-prefix verification is optional; DNS verification needs no code change.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth" className={`${manrope.variable} ${lora.variable} ${tamil.variable}`}><body><BrandIntro /><CartProvider>{children}</CartProvider></body></html>;
}
