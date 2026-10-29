import type { Metadata } from "next";
import { CartPage } from "@/components/CartPage";

export const metadata: Metadata = { title: "Your bag — Asal" };

export default function Page() { return <CartPage />; }
