# Launching the next property site

End-to-end: from an empty folder to a live site on its own domain. Written after
trial-building a second site (Niwa Apartments) against the real feed, so the
"what's automatic" list below is measured, not assumed.

---

## What you need before starting

| Thing | Where it comes from |
|---|---|
| Exact AppFolio property name | The feed — must match **character for character** |
| Street address + ZIP | AppFolio listing |
| A domain | Buy it at Cloudflare Registrar (step 4) |
| Photos | Whatever the property has; the site works without them |
| Floor plans / 3D tours | Optional; placeholders show until provided |

**Get the exact property name first.** A name that doesn't match returns zero
listings and the site launches with no availability:

```bash
node -e "fetch('https://raw.githubusercontent.com/marketing-agm/agm-availabilities/main/listings.json')
  .then(r=>r.json()).then(j=>{const L=j.listings||j;
  console.log([...new Set(L.map(l=>l.property))].sort().join('\n'))})"
```

---

## Step 1 — Ask Claude Code to scaffold it

Paste this, filling in the four values:

> Create a new property site for **\<Property Name\>** (site id `\<short-id\>`).
>
> - AppFolio property name: `\<exact name from the feed\>`
> - Address: \<street, city, state ZIP\>
> - Domain (not bought yet): `\<domain\>`
>
> Copy `src/sites/magnolia-crestview` to `src/sites/<short-id>`, then replace
> everything Magnolia-specific: identity, address, geo, SEO copy, hero copy, and
> the `availability.appfolioProperty`. Clear `floorPlans`, `buildings`,
> `floorPlansSection`, EmailJS keys and analytics IDs so nothing is inherited.
> Delete Magnolia's guides and rewrite `llms.txt`. Empty out `places.json`,
> `photos.json`, `bus-stops.json` and `faq.json` rather than shipping Magnolia's
> content. Run the availability refresh to populate `units.json`, add the site to
> the CI matrix in `.github/workflows/build.yml`, build with `SITE=<short-id>`,
> and open a PR.

### What comes out of that with **no** hand-written copy

Measured on the Niwa trial — 17 units including studios:

- Floor-plan tabs for **every layout in the feed**, in bedroom order, with
  correct sqft and "from" prices
- Section heading derived from the plan count ("Three layouts, …")
- Auto-generated plan panels, stat rows and CTAs ("See available studios →")
- `priceRange` in structured data derived from live rents
- Availability cards, filters, compare, shortlist, unit modals
- Hero, footer, contact, directions links and nav wordmark all from config
- `sitemap.xml`, `robots.txt`, canonical, Open Graph, JSON-LD

### What you still have to supply

The template is generic; the **content is not**. These are copied from Magnolia
and must be replaced or emptied:

| File | Why |
|---|---|
| `places.json` | Neighborhood pins — Magnolia's parks are wrong everywhere else |
| `bus-stops.json` | Transit lines for the map |
| `photos.json` | Gallery. Empty is fine; missing files degrade to placeholders |
| `faq.json` | Property-specific answers |
| `public/guides/` | Magnolia neighborhood guides — delete or rewrite |
| `public/llms.txt` | Property summary for AI crawlers |

Also per-site and **not** inherited: EmailJS keys, GA4/Ads IDs, floor-plan
drawings, 3D tours.

---

## Step 2 — Review the PR

Check the branch preview Cloudflare builds for the PR. Specifically:

- Plan tabs match the layouts the property actually has
- No Magnolia content survived (search the page for "Magnolia" and "Discovery Park")
- Availability count matches the feed

---

## Step 3a — Not ready to buy a domain?

Skip to step 4 and run on the free `*.pages.dev` hostname Cloudflare gives every
project. The site is **fully functional** there — availability, tours, the lead
form, everything. Set `domain` to that hostname and carry on.

**But set `seo.noindex: true` while you do.** It emits `noindex, nofollow` and a
`Disallow: /` robots.txt, so the site is live and shareable but invisible to
search. Without it you accumulate SEO history on a hostname you intend to throw
away — and Google can end up ranking the `.pages.dev` URL, which you then have to
migrate with a change of address and redirects.

Indexing an interim host is a cost you pay later. Not indexing it costs nothing,
because a brand-new site ranks for nothing in its first weeks anyway.

When the domain arrives, it's two lines in `site.config.json`:

```json
"domain": "https://<the-real-domain>",
"seo": { "noindex": false }
```

Everything follows — canonical, Open Graph, sitemap, robots, guide pages.

> Don't run Google Ads to a `.pages.dev` URL. It can't be verified as a domain
> you own, which Google increasingly requires, and the display URL reads as
> untrustworthy in the ad.

## Step 3 — Buy the domain

Cloudflare dashboard → **Domain Registration → Register Domains**. Buying it
there puts DNS in the same account, which makes step 5 automatic.

**On naming:** a distinctive name ranks for itself almost immediately. A generic
one ("Magnolia Apartments") competes with every building in the neighborhood.
Prefer the property's actual name; add the city if it's taken.

---

## Step 4 — Create the Cloudflare Pages project

One project per property, all pointing at this repo:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variable | `SITE=<short-id>` — **production and preview** |

`wrangler.toml` pins the output directory repo-wide, so the field may already be
filled. The `SITE` variable is the one thing that makes this project render a
different property — get it wrong and it silently builds Magnolia.

Set the project's build-watch paths to `src/sites/<short-id>` plus the shared
template folders, so a change to one property doesn't rebuild all 45.

---

## Step 5 — Attach the domain

Pages project → **Custom domains** → add both the apex and `www`. Certificate
issues automatically. Then tell Claude Code the domain is live so `domain` gets
set in config — that one value drives the canonical, Open Graph, sitemap, robots
and the guide pages.

**Merge order matters:** don't deploy the domain change before the domain
resolves. A canonical pointing at a host that doesn't exist tells Google the live
page isn't authoritative.

---

## Step 6 — Turn on the lead path

**This is the step that costs money if skipped.** The tour form shows "Thanks ✓"
whether or not the email sends.

1. EmailJS → **Account → Security → Domains** — add the new domain. The
   allowlist is shared across properties, so it must list every site's domain.
2. Send Claude Code the EmailJS public key / service ID / template ID for this
   property, or reuse the shared ones.
3. **Submit a real tour request on the live site and confirm it arrives.**

---

## Step 7 — Search + ads

- Search Console: add a Domain property, verify with a Cloudflare TXT record,
  submit the sitemap, request indexing
- Google Business Profile at the property address → send the URL for `sameAs`
- GA4 + Google Ads IDs into `analytics.google`, verify with Tag Assistant
  **before** enabling spend

Full detail: `docs/plans/2026-08-17-brand-search-playbook.md` and
`docs/plans/2026-08-07-magnolia-google-ads-playbook.md`.

---

## Checklist

```
[ ] Exact AppFolio property name confirmed against the feed
[ ] Claude Code scaffolds the site; PR opened
[ ] Branch preview reviewed — no Magnolia content, plans and counts correct
[ ] places / bus-stops / photos / faq / guides / llms.txt replaced or emptied
[ ] Site added to the CI matrix
[ ] Domain purchased
[ ] Pages project created with SITE=<short-id> on production AND preview
[ ] Domain attached (apex + www), resolving
[ ] domain set in site.config.json, deployed
[ ] EmailJS domain allowlisted; test tour request received
[ ] Search Console verified, sitemap submitted, indexing requested
[ ] Google Business Profile created; URL added to sameAs
[ ] GA4 / Ads IDs set and verified before any spend
```

Steps 1–2 are ~30 minutes of review. Steps 3–5 are ~20 minutes in dashboards.
Step 6 is the one to not skip.
