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
- The sitemap lists only the two canonical public pages. Omitted `lastmod` values
  are intentional; do not fabricate fresh timestamps on every build.
- Cart and checkout use page-level `noindex, follow`. They are not blocked in
  robots.txt, so crawlers can see those directives. API responses get an
  `X-Robots-Tag: noindex, nofollow` header and are disallowed in robots.txt.
- Favicons, logo and the social image reuse the existing Tamil wordmark and
  oil-drop motif. They are brand assets, not product or facility photographs.
- The existing proxied `www` DNS record gets a Worker route, with a permanent
  Next.js redirect to the apex. An HTTP-apex redirect uses Cloudflare's forwarded
  protocol header. Redirects preserve paths and query strings.
- Store-preview disclosures and live-payment safety gates are unchanged.

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
curl -s https://asaliyarkaiangadi.in/ | grep -o '<meta name="robots"[^>]*>'
curl -s https://asaliyarkaiangadi.in/robots.txt
curl -s https://asaliyarkaiangadi.in/sitemap.xml
curl -I 'https://www.asaliyarkaiangadi.in/collections/wood-pressed-oils?source=check'
curl -I http://asaliyarkaiangadi.in/
```

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
