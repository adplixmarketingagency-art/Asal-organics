# Graph Report - Asal  (2026-11-17)

## Corpus Check
- 108 files · ~37,249 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .css 7, (none) 2, .jsonc 1)

## Summary
- 566 nodes · 1532 edges · 20 communities (15 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 1,600 input · 900 output

## Graph Freshness
- Built from commit: `99618c4a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- products.ts
- [id]/page.tsx
- order-notifications.ts
- CartProvider.tsx
- package.json
- compilerOptions
- payment-handlers.ts
- AdminOrders.tsx
- README.md
- Statement
- generate-brand-assets.mjs
- admin/layout.tsx
- owner-session.ts
- StorefrontDialogs.tsx
- admin-handlers.ts
- razorpay.d.ts
- admin-d1.test.mjs
- d1-orders.ts

## God Nodes (most connected - your core abstractions)
1. `AdminError` - 21 edges
2. `lucide-react` - 21 edges
3. `next` - 21 edges
4. `StorefrontDialogs()` - 19 edges
5. `getProductVariant()` - 19 edges
6. `withDatabase()` - 18 edges
7. `Storefront()` - 17 edges
8. `compilerOptions` - 17 edges
9. `products` - 16 edges
10. `productVariantsFor()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `fixture()` --calls--> `createAdminHandlers()`  [EXTRACTED]
  tests/admin.test.mjs → src/lib/admin-handlers.ts
- `fixture()` --calls--> `createPaymentHandlers()`  [EXTRACTED]
  tests/payments.test.mjs → src/lib/payment-handlers.ts
- `price()` --calls--> `getCartSummary()`  [EXTRACTED]
  tests/checkout-pricing.test.mjs → src/lib/cart.ts
- `price()` --calls--> `getCheckoutPricing()`  [EXTRACTED]
  tests/checkout-pricing.test.mjs → src/lib/checkout-pricing.ts
- `confirmation()` --calls--> `signPaymentOrder()`  [EXTRACTED]
  tests/payments.test.mjs → src/lib/payment-order-token.ts

## Import Cycles
- None detected.

## Communities (20 total, 5 thin omitted)

### Community 0 - "products.ts"
Cohesion: 0.09
Nodes (26): config, Catalogue(), categories, CategorySelector(), HeritageIllustration(), categoryImages, foodLabelReview, productImages (+18 more)

### Community 1 - "[id]/page.tsx"
Cohesion: 0.07
Nodes (43): descriptions, htmlByPath, publicPaths, sitemapUrls, titles, metadata, WoodPressedOils(), lora (+35 more)

### Community 2 - "order-notifications.ts"
Cohesion: 0.15
Nodes (19): POST(), adminConfig(), adminFailure(), adminJson(), keySets, claimNotification(), completeNotification(), deliveryForOrder() (+11 more)

### Community 3 - "CartProvider.tsx"
Cohesion: 0.11
Nodes (38): headers, POST(), CartContext, useCartState(), addItem(), commit(), onStorage(), read() (+30 more)

### Community 4 - "package.json"
Cohesion: 0.05
Nodes (46): config, dependencies, jose@^6.2.16, lucide-react@^0.468.0, next@^16.0.0, pg@^8.23.1, razorpay@^2.9.8, react@^19.2.0 (+38 more)

### Community 5 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 6 - "payment-handlers.ts"
Cohesion: 0.07
Nodes (38): POST, runtime, POST, runtime, POST, runtime, POST, runtime (+30 more)

### Community 7 - "AdminOrders.tsx"
Cohesion: 0.10
Nodes (26): dynamic, OrdersPage(), AdminInstall(), InstallEvent, AdminLogin(), AdminOrders(), action(), signOut() (+18 more)

### Community 9 - "README.md"
Cohesion: 0.33
Nodes (4): node_modules/next/dist/docs Guides, Asal Organics, Before launch, Routes

### Community 11 - "generate-brand-assets.mjs"
Cohesion: 0.10
Nodes (11): buildEnv, deployEnv, root, root, child, email, key, salt (+3 more)

### Community 13 - "owner-session.ts"
Cohesion: 0.12
Nodes (20): dynamic, POST, dynamic, POST, Database, createOwnerHandlers(), dependencies, allowLogin() (+12 more)

### Community 14 - "StorefrontDialogs.tsx"
Cohesion: 0.09
Nodes (49): lucide-react, next, react, metadata, Page(), metadata, Page(), CreditsPage() (+41 more)

### Community 16 - "admin-handlers.ts"
Cohesion: 0.15
Nodes (15): POST, POST(), dynamic, handlers, dynamic, GET, AdminError, readAdminBody() (+7 more)

### Community 18 - "admin-d1.test.mjs"
Cohesion: 0.25
Nodes (17): POST(), runtime, getAdminOrder(), listAdminOrders(), usesD1(), retryNotification(), attachRazorpayOrder(), createPendingOrder() (+9 more)

### Community 19 - "d1-orders.ts"
Cohesion: 0.17
Nodes (18): server-only, cloudflareDatabase(), D1Result, claimNotification(), completeNotification(), retryNotification(), attachRazorpayOrder(), createPendingOrder() (+10 more)

## Knowledge Gaps
- **2 isolated node(s):** `node_modules/next/dist/docs Guides`, `Before launch`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 188 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `StorefrontDialogs.tsx` to `[id]/page.tsx`, `CartProvider.tsx`, `package.json`, `AdminOrders.tsx`, `admin/layout.tsx`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **What connects `node_modules/next/dist/docs Guides`, `Before launch` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `products.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08635703918722787 - nodes in this community are weakly interconnected._
- **Why does `server-only` connect `d1-orders.ts` to `order-notifications.ts`, `package.json`, `payment-handlers.ts`, `owner-session.ts`, `admin-handlers.ts`, `admin-d1.test.mjs`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06784260515603799 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `StorefrontDialogs.tsx` to `products.ts`, `[id]/page.tsx`, `CartProvider.tsx`, `package.json`, `AdminOrders.tsx`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Should `CartProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11414141414141414 - nodes in this community are weakly interconnected._