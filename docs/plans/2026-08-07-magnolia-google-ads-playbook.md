# Magnolia Crestview — Google Ads launch playbook

Property-specific plan for `src/sites/magnolia-crestview`. Everything here is
built around what the site actually is today: **4 available units, all 2BR/2BA,
1,000 sqft, $1,995–$2,195, all available now**, with a *1 Month Free on a
12-month lease* concession running.

Order matters. Phases 0–2 are prerequisites — running ads before they're done
means paying for clicks you can't measure, and Smart Bidding never leaves the
starting line.

---

## Phase 0 — Two blockers to clear first

### 0a. The site advertises inventory that doesn't exist

`site.config.json` and `units.json` disagree, and the ads would inherit the lie:

| Claim | Where | Reality in `units.json` |
|---|---|---|
| "1BR and 2BR/2BA apartments" | `seo.description`, `seo.twitterDescription` | **Zero 1BR units.** All four are 2BR/2BA |
| "From $1,595/mo" | `seo.description`, `seo.twitterDescription` | Cheapest available unit is **$1,995** |
| "$1,395–$1,995/mo" | `schema.priceRange` | Actual range is **$1,995–$2,195** |
| `numberOfBedrooms: "1-2"` | `schema` | Only 2 |

This matters for three separate reasons, in ascending order of cost:

1. **Wasted spend.** Every 1BR searcher who clicks is a guaranteed bounce. In
   Seattle, "1 bedroom" queries are higher-volume than "2 bedroom" — you'd be
   buying the expensive half of a market you can't serve.
2. **Quality Score.** Landing page relevance is scored against ad promise. A
   "from $1,595" ad landing on $1,995 units depresses Ad Rank and *raises* your
   CPC on the terms you do want.
3. **Policy.** Advertising unavailable prices/inventory falls under Google's
   Misrepresentation policy. Enforcement is account-level, not ad-level.

**Decision needed from you:** are 1BRs genuinely part of this property and just
not vacant right now, or does Crestview not have them? That changes the fix:

- *1BRs exist but are occupied* → keep the SEO copy aspirational, but the **ads
  must advertise only 2BR at $1,995+**, and add `1 bedroom` / `studio` as
  campaign negatives until one opens up.
- *No 1BRs at all* → I'll correct `seo`, `schema.priceRange`, and
  `numberOfBedrooms` to match reality. Say the word and it's a two-minute commit.

Either way, **do not launch ads quoting $1,595.**

### 0b. You're still on `magnolia-apartments-agm.pages.dev`

`site.config.json → domain` is the Cloudflare preview subdomain, and the README
confirms production still serves the old root `index.html` with no build step.

Consequences for Ads specifically:
- A `.pages.dev` final URL is allowed but reads as untrustworthy to searchers,
  and you can't verify it as a domain you own for advertiser verification.
- **The tracking added in Phase 1 lives in the Astro build.** Until Cloudflare's
  build command is flipped to `npm run build` with output `dist` and
  `SITE=magnolia-crestview`, the live site keeps serving the old file and *none
  of the conversion tracking exists in production.*

Phase 2 of `docs/plans/2026-06-04-magnolia-launch-playbook.md` is the cutover.
**Do that before spending a dollar.** Then update `domain` to the real hostname.

---

## Phase 1 — Conversion tracking (code side: done)

Ads cannot optimize toward an outcome it can't see. This is the single highest-
leverage thing in the whole plan, and it's now wired into the template.

### What was added

**`src/components/Analytics.astro`**
- Loads `gtag.js` for GA4 and/or Google Ads, driven by
  `site.config.json → analytics.google`. Both IDs empty ⇒ nothing loads, exactly
  like the existing PostHog/Clarity pattern.
- Extends the existing `window.trackEvent()` fan-out: **GA4 receives every
  event**, while **Google Ads receives only events with a conversion label**, so
  you decide what bidding is allowed to chase.
- Captures `gclid` / `wbraid` / `gbraid` and all `utm_*` params into
  `localStorage` for **90 days** (the Ads offline-conversion import window), and
  exposes `window.getAdAttribution()`.

**`public/app.js`**
- **Fixed a real tracking bug.** `#tour-wizard` is a `<div>` with a
  `type="button"` submit, so the delegated `submit` listener in `Analytics.astro`
  *never fired for it*. The 3-step tour wizard — the highest-intent action on the
  site — was recording nothing. It now fires `tour_requested` explicitly with
  bedroom and move-in-window context. **Had you launched before this fix, your
  primary conversion would have reported zero.**
- Lead emails now carry `ad_source`, `ad_campaign`, `ad_keyword`, and
  `ad_click_id`, so leasing sees which ad produced each tour.

### What you do in the Google Ads UI

1. **Create a GA4 property** for the Magnolia domain → copy the `G-XXXXXXXXXX`.
2. **Create the Google Ads account** → Tools → Conversions → copy the
   `AW-XXXXXXXXX`, and **link Ads ↔ GA4** (Tools → Linked accounts).
3. Create these conversion actions (Website → set up manually), and copy each
   **conversion label** — the string after the slash in `AW-123456789/AbC-D_efGh`:

| Conversion action | Category | Count | Primary? | Value |
|---|---|---|---|---|
| Tour requested | Submit lead form | One | **✅ Primary** | $150 |
| Phone click | Contact | One | **✅ Primary** | $100 |
| Email click | Contact | One | Secondary | $40 |
| 3D tour opened | Page view | One | Secondary | $10 |
| Floor plan viewed | Page view | One | Secondary | $5 |

> **Keep exactly two primaries.** "Primary" is what Smart Bidding optimizes
> toward. Mark floor-plan views primary and the algorithm will happily buy you a
> thousand browsers and zero tours. Everything else is Secondary — visible in
> reporting, invisible to bidding.

4. Paste the IDs into `site.config.json`:

```json
"google": {
  "ga4Id": "G-XXXXXXXXXX",
  "adsId": "AW-XXXXXXXXX",
  "conversionLabels": {
    "tour_requested": "AbC-D_efGh",
    "phone_click": "IjK-L_mnOp",
    "email_click": "",
    "tour_3d_opened": "",
    "floor_plan_viewed": ""
  }
}
```

Values are already set in `conversionValues` and need no change.

5. **Verify before spending.** Install the *Google Tag Assistant* extension, load
   the live site, complete a test tour request, and confirm the `conversion` hit
   fires. Ads' conversion status should flip to "Recording conversions" within
   ~24h. **Do not enable Smart Bidding until it does.**

### One caveat on `phone_click`

A `tel:` click is not a completed call — mobile users misclick constantly. It's
a reasonable primary at launch because it's the only call signal you have, which
is why it's valued below a tour request. Once you have volume, switch to a
**Google forwarding number** with call reporting and count only calls ≥ 60
seconds. That's a materially cleaner signal.

---

## Phase 2 — Campaign structure

Do **not** start with Performance Max. PMax needs conversion history to allocate
sensibly; on a cold account with one small property it will spend your budget on
cheap Display placements and report inflated view-through conversions. Earn your
way there.

### Campaign 1 — Brand (Search)

Budget: **$5/day.** Purpose: defensive. Competitors and ILS aggregators
(Zillow, Apartments.com, Zumper) bid on property names; this stops them
intercepting people already looking for you.

- Keywords (Exact + Phrase): `magnolia crestview`, `magnolia crestview apartments`,
  `magnolia crestview seattle`, `2701 w manor pl`, `agm real estate magnolia`
- Bidding: **Manual CPC** or Maximize Clicks with a $2 cap. Brand terms are cheap;
  don't let Smart Bidding overpay for traffic you'd get anyway.
- Expect very low volume. That's fine — this is insurance, not growth.

### Campaign 2 — Non-brand Core (Search)

Budget: **$45–60/day.** This is the real campaign. Four tightly-themed ad groups
so each gets its own ad copy and keyword set:

**Ad group A — Magnolia neighborhood**
```
[apartments in magnolia seattle]
[magnolia seattle apartments for rent]
[apartments for rent magnolia seattle]
"magnolia seattle apartments"
"apartments 98199"
"98199 apartments for rent"
```

**Ad group B — 2 bedroom intent** *(your actual inventory)*
```
[2 bedroom apartments seattle magnolia]
[2 bedroom apartment 98199]
"2 bedroom apartments northwest seattle"
"2 bed 2 bath apartment seattle"
"two bedroom apartment magnolia seattle"
```

**Ad group C — Discovery Park / landmark**
```
[apartments near discovery park]
[apartments near discovery park seattle]
"apartments near discovery park"
"discovery park seattle apartments"
```

**Ad group D — Amenity intent**
```
"apartments with in unit washer dryer seattle"
"apartments with balcony seattle"
"pet friendly apartments magnolia seattle"
"apartments with parking magnolia seattle"
```

Start **Exact + Phrase only**. Broad match works, but only once Smart Bidding has
conversion data to steer it — otherwise it's a budget incinerator. Revisit at
~30 conversions.

### Geo targeting — get this exactly right

- **Radius:** 12 mi around 2701 W Manor Pl, **plus** explicit targeting of
  Ballard, Queen Anne, Interbay, Fremont, Downtown Seattle, and South Lake Union
  (renters relocating within the city, and the SLU/downtown commuter pool your
  `/guides/magnolia-commute/` page speaks to).
- **Critical setting:** Location options → **"Presence: People in or regularly in
  your targeted locations."** The default includes *people interested in* your
  area, which for apartments means paying for out-of-state browsers. This one
  toggle routinely cuts 20–30% of wasted spend.
- Add a **bid adjustment** for a tight 3-mi radius if you see it convert better.

---

## Phase 3 — Negative keywords (the "Magnolia" trap)

**"Magnolia" is dangerously ambiguous.** There is a Magnolia in Texas, one in
Arkansas, one in New Jersey — plus Magnolia Market (Waco), Magnolia Bakery,
Magnolia Network, and Magnolia Hotel. Without negatives you will pay Seattle
CPCs for people looking for Joanna Gaines.

Build these as a **shared negative list** (Tools → Shared library) so it applies
to every campaign, and reuse it across the other 44 properties later.

**Geographic / brand confusion**
```
-magnolia texas    -magnolia tx      -magnolia arkansas   -magnolia ar
-magnolia new jersey  -magnolia nj    -magnolia market    -magnolia bakery
-magnolia network  -magnolia table   -joanna gaines       -magnolia hotel
-magnolia tree     -magnolia flower  -waco
```

**Wrong transaction**
```
-for sale   -buy   -homes for sale   -condos for sale   -rent to own
-realtor    -mortgage   -house for rent   -houses
```

**Wrong inventory** *(see Phase 0a — drop the 1BR/studio lines only if 1BRs open up)*
```
-studio   -1 bedroom   -one bedroom   -3 bedroom   -three bedroom
-4 bedroom   -townhome   -basement   -room for rent   -roommate
```

**Wrong price tier / program**
```
-cheap   -low income   -income restricted   -section 8   -affordable housing
-subsidized   -senior   -55+   -student housing   -income based
```

**Wrong lease type**
```
-short term   -month to month   -furnished   -airbnb   -sublet   -corporate housing
-vacation rental   -temporary
```

**Research / competitor platforms**
```
-zillow   -apartments.com   -zumper   -craigslist   -trulia   -hotpads
-jobs   -hiring   -reviews   -floor plan template
```

Then **check the Search Terms report every 3 days for the first month.** That
report is where the real negatives come from — the list above is just the
predictable waste.

---

## Phase 4 — Ad copy

Responsive Search Ads, 15 headlines / 4 descriptions per ad group. Every claim
below is drawn from real site data.

### Pinning discipline
Pin **one** headline to position 1 (the ad-group-specific promise) and leave the
rest unpinned. Over-pinning collapses the combination space and Google throttles
impressions. Everything unpinned = you lose control of the lead message.

### Ad group B (2 bedroom) — worked example

**Headlines** *(pin H1 to position 1)*
```
H1  2BR/2BA in Magnolia, Seattle     ← pinned pos. 1
H2  1 Month Free · 12-Mo Lease
H3  Available Now — Move In This Month
H4  1,000 Sq Ft · 2 Bed, 2 Bath
H5  In-Unit Washer & Dryer
H6  Private Balcony & Views
H7  Steps From Discovery Park
H8  Updated Kitchens
H9  Covered Parking Available
H10 Pet Friendly
H11 From $1,995/Month
H12 Schedule a Tour Today
H13 Corner Units With 2 Balconies
H14 Quiet Magnolia Neighborhood
H15 See Photos & Floor Plans
```

**Descriptions**
```
D1  Spacious 1,000 sq ft 2BR/2BA homes with in-unit laundry, private balconies
    and updated kitchens. Available now.
D2  1 month free on a 12-month lease. Book a tour in under a minute — pick your
    day and time online.
D3  Live steps from Discovery Park's 534 acres of trails and beach. Quiet
    Magnolia, 15 minutes to downtown.
D4  Covered parking, pet friendly, and Puget Sound views. See real photos and
    floor plans before you visit.
```

For **ad group C**, swap H1 to `Apartments Near Discovery Park` and lead D1 with
the park. For **ad group A**, H1 becomes `Apartments in Magnolia, Seattle`.
Same asset pool otherwise — that's the point of RSAs.

> **The concession is your strongest asset.** *1 Month Free* on a $1,995 unit is
> ~$166/mo off effective rent, which reframes you against $1,829 competitors.
> Keep it in H2 across every ad group, and pull it the moment it expires — a
> dead offer in live ads is both a conversion killer and a policy risk.

### Assets (formerly extensions) — all of these, they're free real estate

- **Sitelinks** (min 4): `Floor Plans & Pricing` → `#floor-plans` ·
  `Photo Gallery` → `#gallery` · `Schedule a Tour` → `#tour` ·
  `Living in Magnolia` → `/guides/living-in-magnolia/` ·
  `Commute Times` → `/guides/magnolia-commute/`
  *(Your three guide pages are ideal sitelink targets and already built.)*
- **Callouts:** `In-Unit W/D` · `Private Balconies` · `Covered Parking` ·
  `Pet Friendly` · `Updated Kitchens` · `Walk to Discovery Park` · `Puget Sound Views`
- **Structured snippet** — *Amenities:* `In-unit laundry, Balcony, Covered parking,
  Updated kitchen, Views`
- **Call asset:** `(206) 694-1713`, scheduled to leasing-office hours only.
  Don't run calls at 11pm into voicemail.
- **Location asset:** link the Google Business Profile for 2701 W Manor Pl. This
  also feeds the map pack — high-value for a physical property.
- **Lead form asset:** skip it. Your on-site 3-step wizard converts better and
  keeps the lead in your EmailJS flow with attribution attached.

### Final URL + tracking

Final URL: your real domain (post-cutover), landing on the main page.

**Final URL suffix** (Settings → Campaign URL options) — this is what makes the
`ad_campaign` / `ad_keyword` fields in your lead emails actually populate:
```
utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={creative}&gclid={gclid}
```
Auto-tagging appends `gclid` on its own; keeping it explicit here means the
capture works even if auto-tagging is ever disabled.

---

## Phase 5 — Bidding and budget

**Sequence — don't skip to step 3:**

| Stage | When | Strategy |
|---|---|---|
| 1 | Days 1–14 | **Maximize Clicks** with a max-CPC cap of **$4.00**. Buys the conversion data Smart Bidding needs. |
| 2 | ~15–30 conversions | Switch to **Maximize Conversions** (no tCPA yet — let it calibrate). |
| 3 | Stable for 2+ weeks | Add **Target CPA**, set ~15% above your actual blended CPA. |

Never set a tCPA on day one. With no conversion history it throttles impressions
to near zero and the campaign looks broken.

**Budget math** — planning assumptions to validate against your own data, not
promises:

```
$50/day × 30 days           = $1,500/mo
÷ ~$4.00 CPC (est. Seattle)  ≈ 375 clicks
× 6–8% lead rate (good LP)   ≈ 22–30 leads
× ~25% tour-show rate        ≈ 6–8 tours
× ~35% application rate      ≈ 2–3 leases
```

**Sanity-check that against vacancy cost.** A vacant $1,995 unit burns ~$66/day.
Four vacant units is ~$266/day in lost revenue — so $50/day in ads to fill them
faster is cheap, and this is why you should *not* under-fund it to $20/day.

**Watch for the good problem:** you have **4 units**. If they lease in three
weeks, **pause the campaign** — don't keep paying for leads you can't house.
Waitlist-building is a different (and much lower-budget) campaign. Set a calendar
reminder to check `units.json` against spend weekly.

---

## Phase 6 — Launch checklist

```
[ ] Phase 0a resolved — 1BR/pricing claims match units.json
[ ] Phase 0b done — Cloudflare cutover complete, custom domain live
[ ] site.config.json → domain updated to the real hostname
[ ] GA4 property created, linked to Ads
[ ] 5 conversion actions created; exactly 2 marked Primary
[ ] ga4Id + adsId + conversionLabels pasted into site.config.json, deployed
[ ] Tag Assistant verified: test tour request fires a conversion hit
[ ] EmailJS template updated with ad_source / ad_campaign / ad_keyword / ad_click_id
[ ] Shared negative keyword list built and attached to both campaigns
[ ] Location option set to "Presence" (not "presence or interest")
[ ] Ad schedule set so call asset only runs during office hours
[ ] Billing set; account-level budget cap configured
[ ] Brand campaign live at $5/day
[ ] Non-brand campaign live at $45–60/day, Maximize Clicks, $4 CPC cap
```

> **EmailJS template note:** the new attribution fields won't appear in lead
> emails until you add `{{ad_source}}`, `{{ad_campaign}}`, `{{ad_keyword}}`, and
> `{{ad_click_id}}` to the template body in the EmailJS dashboard. The code sends
> them regardless; the template decides whether they render.

---

## Phase 7 — Optimization cadence

**Every 3 days, first month**
- Search Terms report → add negatives. This is the highest-ROI recurring task.
- Check spend against `units.json` availability.

**Weekly**
- Pause keywords with 50+ clicks and zero conversions.
- Review RSA asset ratings; replace "Low" headlines.
- Check Clarity session replays of paid visitors who *didn't* convert — you
  already have the heatmap tooling wired, so use it on this segment specifically.

**Monthly**
- Recalculate actual CPA vs. the model above; adjust tCPA.
- Refresh the concession messaging if the offer changed.
- Review device performance — apartment search skews heavily mobile; if mobile
  converts worse, the fix is usually the tour wizard on small screens, not a bid
  adjustment.

**Once you have 30+ conversions/month**, consider adding:
- Broad match on the best-performing exact keywords (Smart Bidding can steer now)
- A **remarketing** campaign — the `gallery_opened` / `floor_plan_viewed` events
  now flowing into GA4 make excellent audience triggers for people who browsed
  but didn't book
- **Performance Max**, but only with a properly built asset group and brand
  exclusions

---

## Portfolio note

Everything in Phase 1 lives in the **shared template**, not in Magnolia's folder.
The `analytics.google` block, click-ID capture, and conversion fan-out are
inherited by every future property — each just needs its own IDs in its own
`site.config.json`. The shared negative keyword list transfers too. The per-site
work for property #2 is IDs, geo, and inventory-specific ad copy.
