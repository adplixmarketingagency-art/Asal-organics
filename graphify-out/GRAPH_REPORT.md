# Graph Report - Asal  (2026-10-30)

## Corpus Check
- 39 files · ~34,598 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .ttf 7, .css 2, .example 1)

## Summary
- 276 nodes · 568 edges · 18 communities (16 shown, 2 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `81fd5b83`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Storefront.tsx
- Implemented (cart and checkout)
- CommerceLayout.tsx
- CartProvider.tsx
- package.json
- compilerOptions
- orders.ts
- Hero Photograph (hero.jpg)
- Coconut Oil Product Photograph (Aishwaryam Oils)
- Groundnut Oil Bottle Product Photograph
- Almond Oil Product Photo (almond.jpg)
- Sesame Oil Product Photograph (sesame.jpg)
- Wood Cold Pressed Sunflower Oil (1 L)
- Castor Oil Product Photo (castor.jpg)
- layout.tsx
- Razorpay payments and seller notifications
- razorpay.d.ts

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `useCart()` - 14 edges
3. `CheckoutPage()` - 13 edges
4. `useCartState()` - 12 edges
5. `formatPrice()` - 12 edges
6. `lucide-react` - 11 edges
7. `next` - 11 edges
8. `Storefront()` - 11 edges
9. `products` - 10 edges
10. `isRecord()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Castor Oil Product Photo (castor.jpg)` --shares_data_with--> `products`  [INFERRED]
  public/images/products/castor.jpg → src/content/products.ts
- `Storefront()` --references--> `Hero Photograph (hero.jpg)`  [EXTRACTED]
  src/components/Storefront.tsx → public/images/hero.jpg
- `products` --references--> `Sesame Oil Product Photograph (sesame.jpg)`  [EXTRACTED]
  src/content/products.ts → public/images/products/sesame.jpg
- `Razorpay Readiness Checklist` --semantically_similar_to--> `Before launch`  [INFERRED] [semantically similar]
  docs/checkout.md → README.md
- `Before launch` --references--> `Razorpay boundary`  [INFERRED]
  README.md → docs/checkout.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Design Reference Sources** — docs_design_mooala, docs_design_good_eggs, docs_design_blue_bottle, docs_design_aishwaryam_oils [EXTRACTED 1.00]
- **Olive Oil Still-Life Composition (cruet, olives, branch, cork)** — public_images_hero_olive_oil_cruet, public_images_hero_olives, public_images_hero_olive_branch, public_images_hero_cork_stopper [EXTRACTED 1.00]
- **Reference Catalogue to Product Photography Binding** — src_content_products_catalogue, src_content_products_coconut, public_images_products_coconut, public_images_products_coconut_one_litre_format [EXTRACTED 1.00]
- **Sesame Product Listing Asset (catalogue entry consumes image, product and label data)** — src_content_products_products, public_images_products_sesame, public_images_products_sesame_wood_pressed_sesame_oil, public_images_products_sesame_label_information_panel [EXTRACTED 1.00]
- **Asal Almond Oil Branded Product Hero Composition** — public_images_products_almond_almond_oil_product, public_images_products_almond_asal_brand, public_images_products_almond_quality_seal_badge, public_images_products_almond_product_packaging_design, public_images_products_almond_botanical_flourish [INFERRED 0.85]
- **Cart to Pre-payment Review Flow** — docs_checkout_asal_cart_v1, docs_checkout_review_ready, docs_checkout_review_invalidation, src_lib_checkout, src_app_api_checkout_route [INFERRED 0.85]
- **Castor Oil Storefront Listing Identity** — public_images_products_castor, public_images_products_castor_castor_oil, public_images_products_castor_aishwaryam_oils, public_images_products_castor_label_design [INFERRED 0.85]
- **Coconut Oil Front-of-Pack Claim Stack** — public_images_products_coconut_brand_mark, public_images_products_coconut_wood_crushed_claim, public_images_products_coconut_natural_cold_pressed, public_images_products_coconut_one_litre_format [INFERRED 0.85]
- **Artisanal Olive Oil Visual Language (style + subject + positioning)** — public_images_hero, public_images_hero_dark_chiaroscuro_food_photography, public_images_hero_single_light_windowside_setup, public_images_hero_artisanal_olive_oil_brand_identity [INFERRED 0.85]
- **Aishwaryam Groundnut Oil Pack + Catalog Visual Identity** — public_images_products_groundnut_product_photograph, public_images_products_groundnut_aishwaryam_oils, public_images_products_groundnut_wood_cold_pressed_groundnut_oil, public_images_products_groundnut_ae_monogram_logo, public_images_products_groundnut_nutrition_information_panel, public_images_products_groundnut_botanical_flourish_ornament [INFERRED 0.85]
- **Razorpay Launch Gate** — docs_checkout_razorpay_boundary, docs_checkout_razorpay_readiness, readme_before_launch, docs_design_vercel_commerce_discovery [INFERRED 0.85]
- **Sesame Oil Brand Identity System (brand lockup, cold-pressed seal, packaging, product)** — public_images_products_sesame_asli_by_aaryam_oils, public_images_products_sesame_cold_pressed_oils_seal, public_images_products_sesame_bottle_packaging, public_images_products_sesame_wood_pressed_sesame_oil [INFERRED 0.85]
- **Sunflower Oil SKU Identity (Photo + Product + Brand + Packaging)** — public_images_products_sunflower_product_photograph, public_images_products_sunflower_sunflower_oil_product, public_images_products_sunflower_asthwarayu_oils_brand, public_images_products_sunflower_sku_label_packaging [INFERRED 0.85]

## Communities (18 total, 2 thin omitted)

### Community 0 - "Storefront.tsx"
Cohesion: 0.16
Nodes (22): lucide-react, react, WoodPressedOils(), Home(), Catalogue(), categories, Editorial(), faqs (+14 more)

### Community 1 - "Implemented (cart and checkout)"
Cohesion: 0.09
Nodes (26): node_modules/next/dist/docs Guides, asal-cart-v1 localStorage Cart, Cart and checkout, Checks, Implemented (cart and checkout), Razorpay boundary, Razorpay Readiness Checklist, 16 KiB Body Limit and no-store Responses (+18 more)

### Community 2 - "CommerceLayout.tsx"
Cohesion: 0.19
Nodes (16): config, next, metadata, Page(), metadata, Page(), CartPage(), useCart() (+8 more)

### Community 3 - "CartProvider.tsx"
Cohesion: 0.13
Nodes (32): headers, POST(), CartContext, useCartState(), addItem(), commit(), onStorage(), read() (+24 more)

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (30): dependencies, lucide-react, next, pg, react, react-dom, server-only, devDependencies (+22 more)

### Community 5 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 6 - "orders.ts"
Cohesion: 0.22
Nodes (20): server-only, POST(), POST(), POST(), attachRazorpayOrder(), createPendingOrder(), ensureSchema(), getOrder() (+12 more)

### Community 7 - "Hero Photograph (hero.jpg)"
Cohesion: 0.36
Nodes (7): Hero Photograph (hero.jpg), Artisanal Olive Oil Brand Positioning, Cork Stopper with Pouring Lip, Olive Branch Sprig, Glass Cruet of Golden Olive Oil, Fresh Green and Black Olives, Traditional Pouring Vessel / Everyday Simplicity Motif

### Community 8 - "Coconut Oil Product Photograph (Aishwaryam Oils)"
Cohesion: 0.39
Nodes (8): Coconut Oil Product Photograph (Aishwaryam Oils), Aishwaryam Oils Circular Brand Seal (ae monogram, 'QUALITY PRODUCTS'), Back-Panel Ingredient & Nutrition Disclosure, "100% Natural, Cold Pressed Coconut Oil" Claim, 1 Litre Bottle Format (clear PET, green screw cap), "Wood Crushed" Processing Claim, Reference Product Catalogue (products.ts), products.ts — Coconut Oil Catalogue Entry

### Community 9 - "Groundnut Oil Bottle Product Photograph"
Cohesion: 0.43
Nodes (7): AE Monogram Brand Mark, Aishwaryam Oils (Brand), Botanical Line-Art Flourish (Composited Overlay), aishwaryamoils.com, Nutrition Information Panel (per 100 g), Groundnut Oil Bottle Product Photograph, Wood Cold Pressed Groundnut Oil

### Community 10 - "Almond Oil Product Photo (almond.jpg)"
Cohesion: 0.52
Nodes (6): Almond Oil Product Photo (almond.jpg), Asal Almond Oil (250ml glass bottle, cold-pressed edible oil), Asal Brand Identity (interlaced 'Ae' monogram), Botanical Line-Art Flourish Motif, Two-Band Bottle Label with Vertical Product Name, Circular 'Assaryam Quality Products' Seal Badge

### Community 11 - "Sesame Oil Product Photograph (sesame.jpg)"
Cohesion: 0.43
Nodes (6): Sesame Oil Product Photograph (sesame.jpg), asli by aaryam oils (brand lockup on label), Clear Bottle with Green Cap and White Wrap-Around Label, Circular 'COLD PRESSED OILS / ASHWARYAM OILS' Quality Badge, Label Information Panel (Nutrition Facts, Batch/JD/PD Dates, FSSAI Licence), Wood Pressed Sesame Oil (1L bottle product shot)

### Community 12 - "Wood Cold Pressed Sunflower Oil (1 L)"
Cohesion: 0.47
Nodes (4): Asthwarayu Oils (Asal) Brand, Sunflower Oil Product Photograph, Clear Bottle / White Label Packaging with Nutritional Panel, Wood Cold Pressed Sunflower Oil (1 L)

### Community 13 - "Castor Oil Product Photo (castor.jpg)"
Cohesion: 0.50
Nodes (3): Castor Oil Product Photo (castor.jpg), Aishwaryam Oils (Brand), Wood Crushed Castor Oil, 250 ml Amber Bottle

### Community 14 - "layout.tsx"
Cohesion: 0.29
Nodes (5): dmSans, fraunces, metadata, RootLayout(), CartProvider()

### Community 16 - "Razorpay payments and seller notifications"
Cohesion: 0.50
Nodes (3): Activation checklist, Razorpay payments and seller notifications, Seller notification system plan

## Knowledge Gaps
- **15 isolated node(s):** `react-dom`, `@types/node`, `@types/pg`, `@types/react`, `@types/react-dom` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 88 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Razorpay boundary` connect `Implemented (cart and checkout)` to `CartProvider.tsx`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useCartState()` (e.g. with `addItem()` and `onStorage()`) actually correct?**
  _`useCartState()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `react-dom`, `@types/node`, `@types/pg` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Implemented (cart and checkout)` be split into smaller, more focused modules?**
  _Cohesion score 0.0873440285204991 - nodes in this community are weakly interconnected._
- **Why does `products` connect `Storefront.tsx` to `Sesame Oil Product Photograph (sesame.jpg)`, `CartProvider.tsx`, `Castor Oil Product Photo (castor.jpg)`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Should `CartProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12560975609756098 - nodes in this community are weakly interconnected._
- **Why does `next` connect `CommerceLayout.tsx` to `Storefront.tsx`, `CartProvider.tsx`, `package.json`, `layout.tsx`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._