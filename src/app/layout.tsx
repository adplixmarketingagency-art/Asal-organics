import type { Metadata } from "next";
import localFont from "next/font/local";
import { CartProvider } from "@/components/CartProvider";
import { BrandIntro } from "@/components/BrandIntro";
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
  title: "Asal — Everyday Essentials. Rooted in Tradition.",
  description: "Explore Asal’s cold-pressed oils, masala and grain flours, milk products, and traditional rice varieties. Browse product prices and quantities.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth" className={`${manrope.variable} ${lora.variable} ${tamil.variable}`}><body><BrandIntro /><CartProvider>{children}</CartProvider></body></html>;
}
