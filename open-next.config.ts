import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// The current storefront has no ISR or on-demand revalidation.
// Add a durable incremental cache before introducing either feature.
const config = defineCloudflareConfig();

// The Git integration runs `npm run build` to create the Worker bundle.
// OpenNext must invoke Next.js directly, not recurse into that adapter build.
config.buildCommand = "npm run build:next";

export default config;
