# Ranking #1 for the property's own name

What Wix's "get found on Google" feature actually does, what's already handled
in this repo, and what only you can do.

---

## The honest version

**Ranking first for your own property name is the easiest win in SEO** — there's
essentially no competition for a unique business name. It isn't a Wix feature so
much as a checklist Wix walks you through. Nothing about it is proprietary, and
none of it requires leaving Cloudflare.

Two things actually decide it:

1. **Being indexed** — Google can't rank a page it hasn't crawled. This is the
   part that feels magic and is really just Search Console.
2. **Entity confidence** — Google has to believe this site *is* the business
   being searched for. That's structured data + a Google Business Profile +
   consistent name/address/phone across the web.

Realistic timeline: **days to ~3 weeks** for a brand-new domain, mostly gated on
crawling, not on anything you can code.

> ### ⚠ One catch specific to this property
>
> "Magnolia Apartments" is a **generic** name. It competes with every apartment
> building in the Magnolia neighborhood, plus Magnolia TX/AR. Expect it to be
> genuinely contested.
>
> The **building** names are the distinctive ones. Someone typing "Magnolia
> Crestview" should hit this site at #1 quickly; "Magnolia Apartments" is a
> harder, slower fight. This is exactly why `alternateName` matters — see below —
> and why the building names stay in `seo.keywords` and in the page copy.

---

## What the code already does

| Signal | Status |
|---|---|
| Canonical URL | ✅ from `domain` |
| `sitemap.xml` + `robots.txt` | ✅ generated, sitemap referenced from robots |
| Open Graph / Twitter cards | ✅ |
| `ApartmentComplex` + `LocalBusiness` JSON-LD | ✅ |
| `FAQPage` JSON-LD | ✅ from `faq.json` |
| `containsPlace` — the three buildings | ✅ |
| `priceRange` from live availability | ✅ |
| `llms.txt` for AI crawlers | ✅ |

### Added for brand search

- **`@id`** — a stable identifier (`<domain>/#property`) so every signal attaches
  to one entity rather than being read as unrelated facts.
- **`alternateName`** — Magnolia Crestview / Vista / Manor. The property was
  renamed; renters still search the buildings. Without this Google has no reason
  to treat those names as the same business.
- **`sameAs`** — reconciles the site with the Google Business Profile and
  socials. **This is the single strongest website↔business signal.** Currently
  empty; fill it in once the GBP exists.
- **`email`**, **`openingHoursSpecification`** — ordinary LocalBusiness
  completeness.
- **Verification meta tags** — `google-site-verification` and `msvalidate.01`,
  config-gated so they emit nothing until set.

---

## What only you can do

### 1. Google Search Console — the actual "make it appear" step

This is the closest thing to Wix's button, and it's free.

1. [search.google.com/search-console](https://search.google.com/search-console)
   → Add property → **Domain** property → `magnoliaapartmentsseattle.com`
2. It gives you a **TXT record**. Because the domain is registered *at*
   Cloudflare, add it in Cloudflare → DNS → Add record → TXT → paste. Verifies in
   minutes.
   *(Alternatively paste the token into `seo.verification.google` and I'll deploy
   it as a meta tag — but the DNS route verifies the whole domain including
   subdomains, so prefer it.)*
3. **Sitemaps → submit `sitemap.xml`.**
4. **URL Inspection → paste the homepage → Request Indexing.** This is the
   "index me now" button. Do the three guide pages too.

### 2. Google Business Profile — the biggest lever for a physical property

For a local business, GBP often outranks the website *and* wins the map pack.

- Create/claim a profile at the leasing address, category **Apartment building**
- Verify it (postcard or video — Google decides which)
- Use the **exact same** name, address and phone as the site. Inconsistent NAP is
  the most common reason Google won't merge a site and a business into one entity
- Add the website URL, hours, and photos
- **Then send me the GBP URL** — it goes in `seo.sameAs`, closing the loop

With a verified GBP, an exact-name search usually returns a knowledge panel plus
your site, which is effectively the whole first screen.

### 3. Bing / IndexNow — free, and Cloudflare does it for you

Bing Webmaster Tools can import directly from Search Console. Then, in
**Cloudflare → your domain → Caching → Configuration**, enable **Crawler Hints**.
Cloudflare pings IndexNow whenever content changes, so Bing/DuckDuckGo/Yandex
re-crawl within minutes.

Google does **not** use IndexNow — for Google, Search Console is the lever.

### 4. Listings consistency

Every ILS listing (Zillow, Apartments.com, Zumper) that names the property should
use the identical name/address/phone and link to the site. These are the
"citations" that build entity confidence, and they're usually already there —
they just need to agree with each other.

---

## Order of operations

```
[ ] Search Console: add domain property, verify via Cloudflare TXT
[ ] Submit sitemap.xml
[ ] Request indexing for / and the three guides
[ ] Create + verify Google Business Profile at the leasing address
[ ] Send me the GBP URL -> seo.sameAs
[ ] Bing Webmaster Tools (import from Search Console)
[ ] Cloudflare -> Caching -> enable Crawler Hints (IndexNow)
[ ] Make ILS listings agree on name/address/phone
```

Steps 1–3 are ~20 minutes and do most of the work. Step 4 is what wins the
generic "Magnolia Apartments" query over time.

---

## How to check progress

- `site:magnoliaapartmentsseattle.com` in Google — shows what's indexed. Empty
  means not yet crawled; that's the thing to fix first, and nothing else matters
  until it isn't empty.
- Search Console → Performance → filter to queries containing the property name.
- [Rich Results Test](https://search.google.com/test/rich-results) on the
  homepage to confirm the structured data parses.

**Don't measure by searching the name yourself.** Personalised and location-biased
results will flatter you. Use Search Console's average position instead.
