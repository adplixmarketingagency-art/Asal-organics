# Graph Report - Asal  (2026-10-29)

## Corpus Check
- 31 files · ~30,901 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .ttf 7, .css 2, (none) 1)

## Summary
- 172 nodes · 362 edges · 10 communities (8 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- compilerOptions
- package.json
- Storefront.tsx
- CheckoutPage.tsx
- CartProvider.tsx
- layout.tsx
- checkout.ts
- Asal — design direction
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `useCart()` - 14 edges
3. `useCartState()` - 12 edges
4. `CheckoutPage()` - 12 edges
5. `formatPrice()` - 12 edges
6. `next` - 11 edges
7. `lucide-react` - 11 edges
8. `Storefront()` - 10 edges
9. `StorefrontDialogs()` - 9 edges
10. `isRecord()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Page()` --calls--> `CartPage()`  [EXTRACTED]
  src/app/cart/page.tsx → src/components/CartPage.tsx
- `Page()` --calls--> `CheckoutPage()`  [EXTRACTED]
  src/app/checkout/page.tsx → src/components/CheckoutPage.tsx
- `WoodPressedOils()` --calls--> `Storefront()`  [EXTRACTED]
  src/app/collections/wood-pressed-oils/page.tsx → src/components/Storefront.tsx
- `Home()` --calls--> `Storefront()`  [EXTRACTED]
  src/app/page.tsx → src/components/Storefront.tsx
- `ProductCard()` --calls--> `addItem()`  [EXTRACTED]
  src/components/ProductCard.tsx → src/components/CartProvider.tsx

## Import Cycles
- None detected.

## Communities (10 total, 2 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 1 - "package.json"
Cohesion: 0.08
Nodes (25): dependencies, lucide-react, next, react, react-dom, devDependencies, @types/node, @types/react (+17 more)

### Community 2 - "Storefront.tsx"
Cohesion: 0.16
Nodes (22): lucide-react, react, WoodPressedOils(), Home(), Catalogue(), categories, Editorial(), faqs (+14 more)

### Community 3 - "CheckoutPage.tsx"
Cohesion: 0.18
Nodes (19): config, next, metadata, Page(), metadata, Page(), CartPage(), useCart() (+11 more)

### Community 4 - "CartProvider.tsx"
Cohesion: 0.27
Nodes (17): CartContext, useCartState(), addItem(), commit(), onStorage(), read(), updateQuantity(), addCartItem() (+9 more)

### Community 5 - "layout.tsx"
Cohesion: 0.29
Nodes (5): dmSans, fraunces, metadata, RootLayout(), CartProvider()

### Community 7 - "checkout.ts"
Cohesion: 0.17
Nodes (11): headers, POST(), CheckoutDetails, CheckoutErrors, CheckoutReview, EMPTY_CHECKOUT_DETAILS, INDIAN_STATES, prepareCheckoutReview() (+3 more)

### Community 8 - "Asal — design direction"
Cohesion: 0.12
Nodes (14): Cart and checkout, Checks, Implemented, Razorpay boundary, Asal — design direction, Explicit limitations, Inspo study, Running locally (+6 more)

## Knowledge Gaps
- **5 isolated node(s):** `react-dom`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 75 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `CheckoutPage.tsx` to `package.json`, `Storefront.tsx`, `layout.tsx`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useCartState()` (e.g. with `addItem()` and `onStorage()`) actually correct?**
  _`useCartState()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `react-dom`, `typescript`, `@types/react` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Storefront.tsx` to `package.json`, `CheckoutPage.tsx`, `CartProvider.tsx`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Storefront.tsx` to `package.json`, `CheckoutPage.tsx`, `CartProvider.tsx`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._