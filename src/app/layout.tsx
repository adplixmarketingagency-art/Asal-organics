import type { Metadata } from "next";
import localFont from "next/font/local";
import { CartProvider } from "@/components/CartProvider";
import "./globals.css";
import "./commerce.css";

const dmSans = localFont({
  src: [
    { path: "../../public/fonts/dm-sans-400.ttf", weight: "400" },
    { path: "../../public/fonts/dm-sans-500.ttf", weight: "500" },
    { path: "../../public/fonts/dm-sans-600.ttf", weight: "600" },
    { path: "../../public/fonts/dm-sans-700.ttf", weight: "700" },
  ],
  variable: "--font-sans",
  display: "swap",
});
const fraunces = localFont({
  src: [
    { path: "../../public/fonts/fraunces-400.ttf", weight: "400" },
    { path: "../../public/fonts/fraunces-500.ttf", weight: "500" },
    { path: "../../public/fonts/fraunces-600.ttf", weight: "600" },
  ],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Asal — Wood-Pressed Oils. Nature, Uncomplicated.",
  description: "Discover a simpler kind of everyday. Explore wood-pressed oils, find your favourite, and learn what makes each one special. Asal storefront design preview.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth" className={`${dmSans.variable} ${fraunces.variable}`}><body><CartProvider>{children}</CartProvider></body></html>;
}
