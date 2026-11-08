import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const config: NextConfig = {
  turbopack: { root: process.cwd() },
  devIndicators: false,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.asaliyarkaiangadi.in" }],
        destination: "https://asaliyarkaiangadi.in/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [
          { type: "host", value: "asaliyarkaiangadi.in" },
          { type: "header", key: "x-forwarded-proto", value: "http" },
        ],
        destination: "https://asaliyarkaiangadi.in/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // A safe enforced baseline preserves Next's static inline bootstrap and
          // Razorpay's third-party modal. A nonce-based script policy needs a
          // separate dynamic-rendering migration and successful checkout testing.
          { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'" },
          ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
        ],
      },
      { source: "/api/:path*", headers: [
        { key: "Cache-Control", value: "no-store" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ] },
    ];
  },
};

export default config;

initOpenNextCloudflareForDev();
