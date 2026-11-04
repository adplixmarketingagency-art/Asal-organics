# Graph Report - Asal  (2026-11-04)

## Corpus Check
- 41 files · ~11,694 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .ttf 7, (none) 3, .css 2)

## Summary
- 245 nodes · 565 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ddd72f84`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Storefront.tsx
- Implemented (cart and checkout)
- checkout.ts
- package.json
- compilerOptions
- orders.ts
- layout.tsx
- CartProvider.tsx
- Razorpay payments and seller notifications
- razorpay.d.ts

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `canAddToBag()` - 14 edges
3. `useCart()` - 14 edges
4. `StorefrontDialogs()` - 13 edges
5. `useCartState()` - 13 edges
6. `CheckoutPage()` - 13 edges
7. `formatPrice()` - 12 edges
8. `lucide-react` - 12 edges
9. `Storefront()` - 11 edges
10. `ProductCard()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Razorpay Readiness Checklist` --semantically_similar_to--> `Before launch`  [INFERRED] [semantically similar]
  docs/checkout.md → README.md
- `Before launch` --references--> `Razorpay boundary`  [INFERRED]
  README.md → docs/checkout.md
- `Before launch` --references--> `Reference Catalogue Attribution Limitation`  [INFERRED]
  README.md → docs/design.md
- `Vercel Commerce Discovery (Shopify)` --conceptually_related_to--> `Razorpay boundary`  [INFERRED]
  docs/design.md → docs/checkout.md
- `CartLines()` --calls--> `updateQuantity()`  [EXTRACTED]
  src/components/CommerceLayout.tsx → src/components/CartProvider.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Design Reference Sources** — docs_design_mooala, docs_design_good_eggs, docs_design_blue_bottle, docs_design_aishwaryam_oils [EXTRACTED 1.00]
- **Cart to Pre-payment Review Flow** — docs_checkout_asal_cart_v1, docs_checkout_review_ready, docs_checkout_review_invalidation, src_lib_checkout, src_app_api_checkout_route [INFERRED 0.85]
- **Razorpay Launch Gate** — docs_checkout_razorpay_boundary, docs_checkout_razorpay_readiness, readme_before_launch, docs_design_vercel_commerce_discovery [INFERRED 0.85]

## Communities (11 total, 2 thin omitted)

### Community 0 - "Storefront.tsx"
Cohesion: 0.14
Nodes (30): lucide-react, react, WoodPressedOils(), Home(), Catalogue(), categories, Editorial(), faqs (+22 more)

### Community 1 - "Implemented (cart and checkout)"
Cohesion: 0.09
Nodes (25): node_modules/next/dist/docs Guides, asal-cart-v1 localStorage Cart, Cart and checkout, Checks, Implemented (cart and checkout), Razorpay boundary, Razorpay Readiness Checklist, 16 KiB Body Limit and no-store Responses (+17 more)

### Community 3 - "checkout.ts"
Cohesion: 0.18
Nodes (20): Routes, next, metadata, Page(), metadata, Page(), CartPage(), useCart() (+12 more)

### Community 4 - "package.json"
Cohesion: 0.05
Nodes (38): config, dependencies, lucide-react, next, pg, react, react-dom, server-only (+30 more)

### Community 5 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 6 - "orders.ts"
Cohesion: 0.20
Nodes (21): server-only, POST(), POST(), POST(), CheckoutReview, attachRazorpayOrder(), createPendingOrder(), ensureSchema() (+13 more)

### Community 7 - "layout.tsx"
Cohesion: 0.29
Nodes (5): dmSans, fraunces, metadata, RootLayout(), CartProvider()

### Community 14 - "CartProvider.tsx"
Cohesion: 0.15
Nodes (28): headers, POST(), CartContext, useCartState(), addItem(), commit(), onStorage(), read() (+20 more)

### Community 16 - "Razorpay payments and seller notifications"
Cohesion: 0.50
Nodes (3): Activation checklist, Razorpay payments and seller notifications, Seller notification system plan

## Knowledge Gaps
- **13 isolated node(s):** `react-dom`, `@types/node`, `@types/pg`, `@types/react`, `@types/react-dom` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 89 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Razorpay boundary` connect `Implemented (cart and checkout)` to `CartProvider.tsx`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useCartState()` (e.g. with `addItem()` and `onStorage()`) actually correct?**
  _`useCartState()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `react-dom`, `@types/node`, `@types/pg` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Storefront.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13953488372093023 - nodes in this community are weakly interconnected._
- **Why does `next` connect `checkout.ts` to `Storefront.tsx`, `package.json`, `layout.tsx`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Should `Implemented (cart and checkout)` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Storefront.tsx` to `checkout.ts`, `package.json`, `CartProvider.tsx`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._