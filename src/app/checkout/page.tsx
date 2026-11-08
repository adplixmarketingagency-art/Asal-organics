import type { Metadata } from "next";
import { CheckoutPage } from "@/components/CheckoutPage";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: true },
};

export default function Page() { return <CheckoutPage />; }
