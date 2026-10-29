# Cart and checkout

## Implemented

- Product cards and product details add items to a shared bag.
- `/cart` supports quantity updates, removal, current catalogue subtotals and empty state.
- Versioned `asal-cart-v1` localStorage holds only product IDs and quantities, survives refresh, and syncs between tabs. Malformed data and unavailable storage are handled. The per-product UI limit is 99, not an inventory claim.
- `/checkout` collects and validates an Indian contact/address, then posts to `/api/checkout` for server-side validation and price recalculation.
- The server returns `review_ready`, not an order. Prices are calculated in integer INR paise from the catalogue. Client-supplied prices are ignored. Duplicate, unknown, empty and invalid lines are rejected.
- Address/contact data stays in React memory for navigation within this visit; it is not saved in localStorage, server storage or application logs. Refresh clears it.
- Checkout reviews become invalid if the bag changes, including a change from another tab.
- JSON requests are limited to 16 KiB and all endpoint responses use `Cache-Control: no-store`.

## Razorpay boundary

Payment integration is deliberately **not implemented**, as requested. The last screen explicitly states that no order is placed and payment is unavailable. It does not fabricate an order ID, clear the bag or claim success.

`src/lib/checkout.ts` contains the reusable server validation/calculation function, and `src/app/api/checkout/route.ts` is the pre-payment review endpoint. A request has this shape:

```json
{
  "items": [{ "productId": "sesame", "quantity": 2 }],
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

Before enabling Razorpay:

1. Replace the attributed reference catalogue with approved merchant products, prices, stock and images.
2. Configure actual delivery eligibility, shipping and tax rules. They are currently **unconfigured**, not free or zero-rated. The UI therefore shows an estimated items subtotal, not a payable grand total.
3. Provision durable merchant order storage and appropriate privacy, support and fulfilment policies.
4. Revalidate stock and recompute the final payable amount on the server when creating a Razorpay order. Never trust browser totals or a previous review response.
5. Create and persist pending merchant orders idempotently, with a server-side connection to the provider order ID. Keep all payment secrets server-only.
6. Verify payment signatures and signed webhook events on the server; deduplicate events. Only verified payment should mark an order paid, trigger fulfilment or clear the bag.
7. Add abuse/rate limiting and integration tests for failures, retries and webhook replay before launch.

## Checks

`npm test` covers cart normalization, merging, persistence format, bounds, integer totals, form validation, tamper-resistant review calculation, API errors and body size limits.

Run `npm run typecheck` and `npm run build` as well. For manual testing, add oils → open bag → adjust quantity → checkout → try invalid fields → submit test details → edit review. Check refresh, a second tab, empty bag and a narrow mobile viewport. No checkout request contacts Razorpay.
