# Asal search indexing

## Diagnosis — November 8, 2026

The deployed homepage returned HTTP 200 but included
`<meta name="robots" content="noindex, nofollow">`. This was inherited from the
root layout by every page. The sitemap returned 404, the collection duplicated
the homepage, the HTTP apex did not redirect, and `www` returned Cloudflare 522.

## Changes

- Public pages allow indexing and use `https://asaliyarkaiangadi.in` canonicals.
- The title, visible homepage heading, description and footer identify
  **Asal Iyarkai Angadi**. **Asaliyarkaiangadi**, **Asal Organics** and the Tamil
  name are consistent alternate brand names in the homepage structured data.
- `WebSite` and `Organization` JSON-LD use only known brand information.
  No review, local address, certification or purchase availability is invented.
- The oil collection has its own metadata, breadcrumb structured data, heading,
  description and three initially rendered wood-pressed products. The homepage
  links to it with a normal crawlable anchor.
- The sitemap lists the homepage, oil collection and 20 real catalogue product
  pages. Omitted `lastmod` values are intentional; do not fabricate fresh
  timestamps on every build.
- Cart and checkout use page-level `noindex, follow`. They are not blocked in
  robots.txt, so crawlers can see those directives. API responses get an
  `X-Robots-Tag: noindex, nofollow` header and are disallowed in robots.txt.
- Favicons, logo and the social image reuse the existing Tamil wordmark and
  oil-drop motif. They are brand assets, not product or facility photographs.
- The existing proxied `www` DNS record gets a Worker route, with a permanent
  Next.js redirect to the apex. An HTTP-apex redirect uses Cloudflare's forwarded
  protocol header. Redirects preserve paths and query strings.
- Store-preview disclosures and live-payment safety gates are unchanged.

## Follow-up audit — November 8, 2026

Method: the GitHub
[`coreyhaines31/marketingskills` SEO audit skill, v2.2.2](https://github.com/coreyhaines31/marketingskills/tree/96798cf38736ecdba015a1d2b0521b0c8f8f41dd/skills/seo-audit),
pinned to `96798cf38736ecdba015a1d2b0521b0c8f8f41dd`, using its indexing-first
checklist. The prior noindex fix deployed at 06:40 UTC that same day; this
follow-up began minutes later, without a confirmed Google recrawl.

Observed in signed-out Google Search with English/India search parameters:

- `Asaliyarkaiangadi`: Google substituted “Asal Iyarkai Angadi”; the domain was
  not among the first-page organic listings.
- Selecting the exact unspaced spelling showed no ordinary organic listings.
- `site:asaliyarkaiangadi.in`: “did not match any documents.”

These are search observations, **not** Search Console URL Inspection results.
Indexed count, Google's selected canonical, last crawl, impressions and average
position remain unverified without access to the owner's property. Search results
vary and a `site:` query is not exhaustive.

Remaining site-side gap addressed: product detail buttons had no crawlable
destination. Product names now link to static `/products/<catalogue-id>` pages
with unique metadata, canonicals, visible English/Tamil names, server-rendered
pack/price tables, breadcrumbs and related-product links. Image buttons retain
quick-view dialogs; bag variant IDs and prices are unchanged. Pending grain
prices remain pending. These pages improve navigation and product discovery;
their previous absence is **not established as the cause of brand nonindexing**.

No new keyword landing pages, fabricated product claims, sale offers, ratings,
backlinks or business profiles were created. Product rich-result eligibility is
not claimed while checkout is a preview and product imagery is unavailable.
Owner-approved product descriptions, real product photos, contact/business
details and policies are future content work, not facts to invent for SEO.

Submit the sitemap and request homepage indexing once as below. Check Page
indexing after Google recrawls; compare brand impressions and clicks over the
following 3–4 weeks before judging ranking impact. Do not repeatedly request
indexing or keep changing the brand title to chase minute-to-minute results.

## After deployment: owner action in Search Console

1. Open Google Search Console with the Google account that should own the site.
2. Add the **Domain property** `asaliyarkaiangadi.in` if it is not already present.
3. Copy Google's specific TXT verification value into Cloudflare DNS and verify.
   Do not guess the value or add Google login credentials to this repository.
4. In **Sitemaps**, submit `https://asaliyarkaiangadi.in/sitemap.xml`.
5. In **URL inspection**, inspect `https://asaliyarkaiangadi.in/`, choose
   **Test live URL**, confirm crawling and indexing are allowed, then choose
   **Request indexing**. Repeat for `/collections/wood-pressed-oils`.
6. Monitor Page indexing for remaining exclusions and Performance for brand
   queries. A `site:` search is not a definitive indexing diagnostic.

For an existing **URL-prefix property**, the optional public
`GOOGLE_SITE_VERIFICATION` build variable renders Google's verification meta tag.
It must be set before the Cloudflare Git build; setting only a Worker runtime
secret will not change prerendered HTML. DNS verification is preferred and works
with the isolated deployment script without build environment changes.

Google controls crawling and inclusion. Recrawling can take days to weeks, and
requesting indexing does not guarantee inclusion or a particular ranking.
No Search Console submission or ownership verification is performed by Git push.

## Release checks

Run `npm test`, `npm run typecheck`, and an isolated `npm run build` without local
`.env*` files, using Node.js 22 or later. Check both the rendered HTML and the
Worker deployment, not just source metadata:

```sh
npm run seo:check
# Or verify an isolated local Worker:
npm run seo:check -- http://127.0.0.1:8787
curl -s https://asaliyarkaiangadi.in/ | grep -o '<meta name="robots"[^>]*>'
curl -s https://asaliyarkaiangadi.in/robots.txt
curl -s https://asaliyarkaiangadi.in/sitemap.xml
curl -I 'https://www.asaliyarkaiangadi.in/collections/wood-pressed-oils?source=check'
curl -I http://asaliyarkaiangadi.in/
```

`seo:check` checks every public page's HTTP response, canonical, unique title and
description, H1, server-rendered structured data, product links and pack content.
It also checks the sitemap, robots.txt, Googlebot-UA content and private/404
noindex exclusions. It does not connect to Search Console or test actual rankings.

Follow-up pre-push validation passed: 92 tests, TypeScript, the isolated
OpenNext/Cloudflare build, and HTTP checks for all 22 public URLs on the local
Worker. Browser checks at 1440×1000 and 390×844 covered product navigation,
rendered breadcrumbs, pack selection, a 500 ml / ₹210 bag item, pending Ragi
pricing, quick-view-to-product navigation and horizontal overflow. No browser
console warnings or errors were observed in those flows. This is not a Core Web
Vitals field assessment, Googlebot verification or a full accessibility audit.

Expect `index, follow` on public pages, `noindex, follow` on cart and checkout,
200 XML with only canonical URLs, and 308 redirects to the HTTPS apex without
loops. An unknown route must still return 404 with `noindex`. Ensure Googlebot
can load the same content and CSS/JS as other visitors. Cloudflare may prepend
its managed content-signal comments to robots.txt; confirm that the application
rules and sitemap URL still appear and that no edge rule blocks Googlebot.

The `www` route depends on the existing proxied DNS record. If `www` still returns
522 after deployment, inspect that record and the Worker's route in Cloudflare.
Do not change DNS for unrelated mail or services.

## References

- [Google: noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Google: site names](https://developers.google.com/search/docs/appearance/site-names)
- [Google: request recrawling](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)
- [Google: sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Cloudflare: Worker routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)
