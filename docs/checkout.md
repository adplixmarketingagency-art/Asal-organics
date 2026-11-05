# Cart and checkout

## Implemented

- Product cards and product details add items to a shared bag.
- `/cart` supports quantity updates, removal, current catalogue subtotals and empty state.
- The `asal-cart-v1` localStorage key now writes version 2: only product IDs, canonical variant IDs and quantities. Version 1 bags migrate to the originally listed base pack. Bags survive refresh and sync between tabs. Malformed data and unavailable storage are handled. The per-pack UI limit is 99, not an inventory claim.
- `/checkout` collects and validates an Indian contact/address, then posts to `/api/checkout` for server-side validation and price recalculation.
- The server returns `review_ready`, not an order. Proportional pack prices are rounded up to whole rupees, then calculated in integer INR paise. Client-supplied prices and sizes are ignored. Duplicate packs, unknown/mismatched variants, empty and invalid lines are rejected. Different packs of one product are separate lines.
- Address/contact data stays in React memory during review, not localStorage or application logs. Live order creation saves delivery details in the existing order store; sandbox does not. Opening Razorpay shares name, email and phone with the payment provider. Refresh clears local form details.
- Checkout reviews become invalid if the bag changes, including another tab. An in-progress payment retains its original review for verification retries.
- JSON requests are limited to 16 KiB and all endpoint responses use `Cache-Control: no-store`.

## Razorpay boundary

Razorpay Standard Checkout is integrated. Test mode can run without a database using a signed server-issued order reference; no real money or fulfilment order is involved. Live mode requires the existing durable order store and launch prerequisites. Only independently verified captured payments report success. See [payment setup](payments.md).

`src/lib/checkout.ts` contains the reusable server validation/calculation function, and `src/app/api/checkout/route.ts` is the pre-payment review endpoint. A request has this shape:

```json
{
  "items": [{ "productId": "sesame", "variantId": "sesame:500ml", "quantity": 2 }],
  "customer": {
    "fullName": "Test Customer",
    "email": "checkout@example.com",
    "phone": "9876543210",
    "address": "12 Test Street",
    "apartment": "",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pincode": "600001",
    "country": "IN"
  }
}
```

Before enabling **live** Razorpay payments:

1. Confirm the base quantity behind Ragi and Bajra prices, and inventory availability. The owner authorised proportional whole-rupee rounding for other pack sizes; see [catalogue rules](catalogue.md). The catalogue uses the owner’s handwritten product/pack-size lists, without product photography.
2. Configure actual delivery eligibility, shipping and tax rules. They are currently **unconfigured**, not free or zero-rated. The UI therefore shows an estimated items subtotal, not a payable grand total.
3. Provision durable merchant order storage and appropriate privacy, support and fulfilment policies.
4. Revalidate stock and recompute the final payable amount on the server when creating a Razorpay order. Never trust browser totals or a previous review response.
5. Create and persist pending merchant orders idempotently, with a server-side connection to the provider order ID. Keep all payment secrets server-only.
6. Verify payment signatures and signed webhook events on the server; deduplicate events. Only verified payment should mark an order paid, trigger fulfilment or clear the bag.
7. Add abuse/rate limiting and integration tests for failures, retries and webhook replay before launch.

## Checks

`npm test` covers cart migration, per-pack merging/removal, persistence format, quantity bounds, ceiling-rounded prices, integer totals, form validation, forged variants, tamper-resistant review calculation, mocked payment API errors and body size limits. Mocked provider tests are not evidence of a real Razorpay test transaction.

Run `npm run typecheck` and `npm run build` as well. For manual testing, add products → open bag → adjust quantity → checkout → try invalid fields → submit test details → edit review. Check refresh, a second tab, empty bag and a narrow mobile viewport. Review alone does not contact Razorpay. The payment button creates a provider order and opens hosted checkout; use test keys and synthetic details for local QA.
