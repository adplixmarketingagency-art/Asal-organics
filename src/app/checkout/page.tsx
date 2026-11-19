import type { Metadata } from "next";
import { CheckoutPage } from "@/components/CheckoutPage";
import { CustomMasalaCheckout } from "@/components/CustomMasalaCheckout";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: true },
};

export default async function Page({ searchParams }: {
  searchParams: Promise<{ custom?: string }>;
}) {
  const customMasala = (await searchParams).custom === "masala";
  return customMasala ? <CustomMasalaCheckout /> : <CheckoutPage />;
}
