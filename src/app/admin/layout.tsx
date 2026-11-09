import type { Metadata, Viewport } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Owner desk", robots: { index: false, follow: false },
  applicationName: "Asal Owner Desk",
  description: "Your private Asal order and fulfilment workspace.",
  manifest: "/owner-app.webmanifest",
  appleWebApp: { capable: true, title: "Asal Orders", statusBarStyle: "default" },
  icons: {
    icon: { url: "/icons/owner-192.png", type: "image/png", sizes: "192x192" },
    apple: { url: "/icons/owner-180.png", type: "image/png", sizes: "180x180" },
  },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: "#234d3b", colorScheme: "light",
};
export default function AdminLayout({ children }: { children: React.ReactNode }) { return children; }
