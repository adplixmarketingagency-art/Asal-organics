import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// The current storefront has no ISR or on-demand revalidation.
// Add a durable incremental cache before introducing either feature.
export default defineCloudflareConfig();
