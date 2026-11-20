# Graph Report - Asal  (2026-11-20)

## Corpus Check
- 125 files · ~43,830 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .css 8, (none) 2, .jsonc 1)

## Summary
- 629 nodes · 1779 edges · 16 communities (12 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 1,600 input · 900 output

## Graph Freshness
- Built from commit: `674c6567`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ref_node_assert
- [id]/page.tsx
- custom-masala.ts
- CartProvider.tsx
- package.json
- compilerOptions
- payment-handlers.ts
- AdminOrders.tsx
- Statement
- generate-brand-assets.mjs
- order-notifications.ts
- products.ts
- razorpay.d.ts
- admin-orders.ts

## God Nodes (most connected - your core abstractions)
1. `AdminError` - 24 edges
2. `lucide-react` - 24 edges
3. `next` - 23 edges
4. `withDatabase()` - 22 edges
5. `useCart()` - 20 edges
6. `isRecord()` - 20 edges
7. `StorefrontDialogs()` - 19 edges
8. `usesD1()` - 19 edges
9. `cloudflareDatabase()` - 19 edges
10. `getProductVariant()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `fixture()` --calls--> `createCustomMasalaHandler()`  [EXTRACTED]
  tests/custom-masala-requests.test.mjs → src/lib/custom-masala-handlers.ts
- `fixture()` --calls--> `createAdminHandlers()`  [EXTRACTED]
  tests/admin.test.mjs → src/lib/admin-handlers.ts
- `fixture()` --calls--> `createPaymentHandlers()`  [EXTRACTED]
  tests/payments.test.mjs → src/lib/payment-handlers.ts
- `CreditsPage()` --calls--> `BrandWordmark()`  [EXTRACTED]
  src/app/credits/page.tsx → src/components/BrandWordmark.tsx
- `price()` --calls--> `getCheckoutPricing()`  [EXTRACTED]
  tests/checkout-pricing.test.mjs → src/lib/checkout-pricing.ts

## Import Cycles
- None detected.

## Communities (16 total, 4 thin omitted)

### Community 0 - "ref_node_assert"
Cohesion: 0.11
Nodes (10): config, productImages, escapeHtml(), loadTsxComponent(), recipe, renderElement(), require, source() (+2 more)

### Community 1 - "[id]/page.tsx"
Cohesion: 0.08
Nodes (29): descriptions, htmlByPath, publicPaths, sitemapUrls, titles, metadata, WoodPressedOils(), CreditsPage() (+21 more)

### Community 2 - "custom-masala.ts"
Cohesion: 0.24
Nodes (12): CustomMasalaCard(), CustomMasalaMenu(), formatMoneyPaise(), calculateCustomMasala(), CustomMasalaLine, CustomMasalaQuote, customMasalaWhatsAppUrl(), GRINDING_PAISE_PER_KG (+4 more)

### Community 3 - "CartProvider.tsx"
Cohesion: 0.06
Nodes (68): node_modules/next/dist/docs Guides, Asal Organics, Before launch, Routes, next, metadata, viewport, headers (+60 more)

### Community 4 - "package.json"
Cohesion: 0.05
Nodes (45): config, dependencies, jose@^6.2.16, lucide-react@^0.468.0, next@^16.0.0, pg@^8.23.1, razorpay@^2.9.8, react@^19.2.0 (+37 more)

### Community 5 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 6 - "payment-handlers.ts"
Cohesion: 0.07
Nodes (43): server-only, POST, runtime, POST, runtime, POST, runtime, POST (+35 more)

### Community 7 - "AdminOrders.tsx"
Cohesion: 0.13
Nodes (17): AdminCustomerDetails(), AdminCustomRecipe(), money(), rate(), AdminInstall(), InstallEvent, AdminOrders(), action() (+9 more)

### Community 11 - "generate-brand-assets.mjs"
Cohesion: 0.10
Nodes (11): buildEnv, deployEnv, root, root, child, email, key, salt (+3 more)

### Community 13 - "order-notifications.ts"
Cohesion: 0.06
Nodes (59): jose, dynamic, OrdersPage(), dynamic, POST, dynamic, POST, POST (+51 more)

### Community 14 - "products.ts"
Cohesion: 0.08
Nodes (61): lucide-react, react, dynamicParams, generateMetadata(), productForPage(), ProductPage(), Props, BrandIntro() (+53 more)

### Community 19 - "admin-orders.ts"
Cohesion: 0.07
Nodes (59): dynamic, POST, getAdminOrder(), listAdminOrders(), AdminOrder, AdminOrderDetail, FulfillmentStatus, fulfillmentStatuses (+51 more)

## Knowledge Gaps
- **2 isolated node(s):** `node_modules/next/dist/docs Guides`, `Before launch`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 206 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `CartProvider.tsx` to `[id]/page.tsx`, `custom-masala.ts`, `package.json`, `order-notifications.ts`, `products.ts`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **What connects `node_modules/next/dist/docs Guides`, `Before launch` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ref_node_assert` be split into smaller, more focused modules?**
  _Cohesion score 0.10967741935483871 - nodes in this community are weakly interconnected._
- **Why does `server-only` connect `payment-handlers.ts` to `admin-orders.ts`, `package.json`, `order-notifications.ts`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Should `[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08163265306122448 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `products.ts` to `[id]/page.tsx`, `custom-masala.ts`, `CartProvider.tsx`, `package.json`, `AdminOrders.tsx`, `order-notifications.ts`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Should `CartProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05958485958485959 - nodes in this community are weakly interconnected._