# Heritage, pack pricing and opening animation

Deployed to https://asaliyarkaiangadi.in on 5 November 2026.
Cloudflare Worker version: `f5e16bf0-d6c2-4cab-89fc-0974276f9688`.

## Changed files in this update

- `src/components/BrandIntro.tsx`: new white, centred opening screen with a finite gold oil drip and ripple.
- `src/components/BrandWordmark.tsx`: shared Tamil vector wordmark, replacing only the final pulli with an oil drop.
- `src/app/layout.tsx`: shared intro mount and local fonts.
- `src/app/heritage.css`: typography, intro motion, responsive layouts and restrained kolam decoration.
- `src/components/Kolam.tsx`, `public/images/kolam-sikku.svg`, `public/images/kolam-border.svg`: crisp transparent vector ornaments.
- `src/components/Storefront.tsx`, `src/components/Editorial.tsx`, `src/components/Catalogue.tsx`: bilingual categories, editorial sections and base-pack price-filter explanation.
- `src/components/ProductCard.tsx`, `src/components/StorefrontDialogs.tsx`: pack selection and corresponding prices.
- `src/content/products.ts`: canonical pack variants and proportional whole-rupee ceiling prices.
- `src/lib/cart.ts`, `src/components/CartProvider.tsx`, `src/components/CommerceLayout.tsx`, `src/components/CartPage.tsx`, `src/components/CheckoutPage.tsx`: separate pack lines and checkout integration.
- `src/lib/checkout.ts`, `src/lib/orders.ts`: server-priced variants and existing order-snapshot support, without new database tables.
- `tests/brand.test.mjs`, `tests/products.test.mjs`, `tests/cart.test.mjs`, `tests/checkout.test.mjs`, `tests/payments.test.mjs`: regression coverage.
- `public/fonts/`, `public/images/editorial/`, `docs/design-assets.md`: licensed font/image assets and provenance.
- `docs/catalogue.md`, `docs/checkout.md`: pricing and variant documentation.
- `graphify-out/`: refreshed local code graph.

Earlier payment/security edits already present in the working tree were preserved.

## Validation

- 64 tests passed; none failed or skipped.
- Isolated OpenNext production build, including TypeScript, passed.
- Current source/assets matched the deployed staging copy.
- All three generated OpenNext environment exports were empty before deployment. No local environment files were copied into the build.
- `git diff --check` passed.
- Browser checks covered desktop and 390/320-pixel widths, with no document horizontal overflow.
- Opening screen rendered white with the centred vector logo and a falling oil drop. It cleared automatically, dismissed on interaction and did not replay on internal cart/checkout navigation.
- Reduced-motion emulation skipped the intro.
- With JavaScript disabled, CSS still hid the intro after its finite animation.
- Selecting Groundnut Oil 500 ml showed ₹210, and 1 Litre showed ₹420. Both packs remained separate cart lines; quantity changes updated totals independently.
- A local checkout review with synthetic details returned the expected ₹2,980 subtotal. No payment was initiated.
- Live verification confirmed the new assets, intro and Curry Masala 250 g price of ₹120. No warning/error console entries were observed during the checked flows.
- Graphify updated to 293 nodes and 703 edges using local code-only extraction. CSS is not covered by that extractor, and SQL extraction remains unavailable because its parser is not installed.

## How to check

1. Reload the live homepage to see the roughly 1.4-second intro.
2. Enable the operating system’s reduced-motion preference and reload: the shop should appear without the intro.
3. Choose different packs in the collection and check the displayed price.
4. In sandbox mode, add two different packs of a product, open the bag and adjust their quantities.
5. Use synthetic delivery details to review checkout. This check does not require opening Razorpay.

## Remaining owner input / limits

- Ragi and Bajra still need confirmation of the base quantities corresponding to their supplied prices.
- Product photos, the FSSAI certificate/licence details and the wood-pressed oil catalogue still require owner-supplied information.
- Real-payment launch gates remain closed: catalogue and final purchase-total approval are unchanged. Delivery and tax rules still need confirmation.
- The previously supplied Razorpay test credentials failed authentication in earlier testing and were shared in chat. Rotate them and configure replacement secrets before attempting another end-to-end sandbox payment.
- These checks are not evidence of a successful Razorpay transaction or a completed Cloudflare account-level security audit; the latter previously lacked the required permissions.
