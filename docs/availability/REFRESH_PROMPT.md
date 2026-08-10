# Availability Refresh — Claude Code Routine prompt

This is the master prompt a scheduled **Claude Code Routine** runs to refresh a
property's live availability from the AGM AppFolio feed and open a PR for review.
It mirrors the `agm-availabilities` workflow, adapted to this multi-site template.

**How the data flows:** AppFolio public listings → parsed into a clean feed by the
`agm-availabilities` app (`listings.json`) → this repo's `scripts/refresh-availability.mjs`
filters to one property and **merges** it into `src/sites/<site>/units.json`,
preserving curated marketing copy. You (a human) review and merge the PR.

---

## The prompt

```
Refresh the live availability for Magnolia Crestview and open a PR.

Work in the repo marketing-agm/magnolia-apartments-agm. Follow this exact workflow:

### 1. Start clean
- Ensure you're on the latest default branch: `git fetch origin main && git checkout -B availability/refresh-magnolia-crestview-$(date +%Y%m%d-%H%M) origin/main`

### 2. Run the deterministic refresh (do NOT hand-edit units.json)
- `node scripts/refresh-availability.mjs --site magnolia-crestview`
- The script fetches the feed named in `src/sites/magnolia-crestview/site.config.json`
  → `availability.source`, filters to `availability.appfolioProperty`, and MERGES:
    • AppFolio drives: beds, baths, sqft, rent, available, availType
    • Preserved by unit id: floor, floorNum, features, featured, plan (curated copy)
    • New units: created with a guessed plan/floor + EMPTY features, and flagged
    • Vanished units: removed
- Read the printed change report and the final `CHANGED=` line.

### 3. If CHANGED=false
- Nothing to do. Do NOT open a PR. Report "No availability changes for Magnolia
  Crestview (feed updated <date>)." and stop.

### 4. If CHANGED=true — review before committing
- `git diff src/sites/magnolia-crestview/units.json` and sanity-check:
  - Curated fields (features, floor, featured, plan) on EXISTING units are untouched.
  - Rent/availability/bed/bath/sqft changes match the report.
  - If any REMOVED units look wrong (e.g. the feed briefly dropped everything),
    STOP and report instead of committing. The script already refuses to write on
    an empty feed, but use judgement on partial drops.
- Handle any NEW units (report shows "⚠ review plan/features/floor"):
  - Do NOT invent marketing features — leave `features: []` for a human to fill,
    and say so in the PR body.
  - If a new unit's `plan` key is not in `PLAN_LABELS` (see public/app.js) or the
    config's `floorPlans`, note in the PR that a new floor-plan type needs adding,
    or the card label will render blank.

### 5. Check the bedroom-mix / price-floor signal (paid-marketing follow-up)
The script prints a machine-readable trailer on every run:
```
CHANGED=            BEDROOM_MIX_CHANGED=   BEDS_GAINED=   BEDS_LOST=
PRICE_FLOOR_CHANGED=   PRICE_FLOOR=   PRICE_FLOOR_WAS=
```
The site updates itself from `units.json`, but **the Google Ads account and the
hand-written SEO prose do not.** If the mix or the floor price moved, the
campaign is now advertising inventory that doesn't exist, or missing inventory
that does — both burn budget quietly.

- **If `BEDROOM_MIX_CHANGED=true`** — the set of available bedroom counts changed:
  - Add a **`⚠ ACTION REQUIRED — Google Ads`** section at the **top** of the PR
    body (above the change report), pasting the action block the script printed.
  - Label the PR `needs-ads-update` if the label exists.
  - Call it out explicitly in your report-back — this is the headline, not a
    footnote.
- **If `PRICE_FLOOR_CHANGED=true`** — the lowest available rent moved. The
  "from $X" sentence in `site.config.json` → `seo.description` and
  `seo.twitterDescription` is hand-written prose and is now stale.
  - Still **do not edit it in this PR** (guardrail: units.json only). Flag it in
    the PR body as a follow-up with the exact old → new numbers.
  - `schema.priceRange` needs no action — it is derived from `units.json` at
    build time in `BaseLayout.astro` and tracks the feed automatically.
- **If both are `false`** — nothing to do; omit the section entirely.

Background and the full ads-side checklist:
`docs/plans/2026-08-07-magnolia-google-ads-playbook.md` § Phase 0a.

### 6. Commit, push, open PR
- `git add src/sites/magnolia-crestview/units.json`
- `git commit` with a one-line summary (e.g. "Availability refresh — Magnolia
  Crestview: 1 new, 1 removed, 1 updated").
- `git push -u origin <branch>`
- Open a PR into `main`. Title: "Availability refresh — Magnolia Crestview (<date>)".
  Body: the `⚠ ACTION REQUIRED — Google Ads` section from step 5 if any, then the
  full change report from step 2. If there are NEW units, add a
  "⚠ Needs human enrichment before merge" section listing them.

### 7. Report back
- Post the change report so a human can review and merge.
- Lead with the bedroom-mix/price-floor warning if either fired.

### Guardrails
- Only `units.json` changes. Never touch other files — the bedroom-mix signal is
  **reported, never auto-applied**. Editing SEO copy or touching the ad account
  is a human decision; your job is to make sure it can't be missed.
- Never hand-edit `units.json` to "fix" data — re-run the script; it's the source of truth for the merge.
- Empty/zero-unit feed → the script writes nothing and exits; do not force an empty units.json.
- Merging the PR triggers the normal Cloudflare build/deploy, so the live site updates on merge.
```

---

## Adding more properties later

The script is site-generic. For each new site:
1. Add an `availability` block to `src/sites/<id>/site.config.json`:
   ```json
   "availability": {
     "source": "https://raw.githubusercontent.com/marketing-agm/agm-availabilities/main/listings.json",
     "appfolioProperty": "<exact property name as it appears in the feed>"
   }
   ```
2. Run `node scripts/refresh-availability.mjs --site <id>`.
3. Duplicate this Routine (or extend it to loop over every site).
