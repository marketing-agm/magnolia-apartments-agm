# Launch Magnolia — next-steps playbook

> _Archived planning artifact from the 2026-06-04 working session. Captures the launch sequence agreed on after PRs #19 (FAQ/guides), #20 (Astro multi-site + Sveltia CMS), and #21 (EmailJS tour-form wiring) were merged to `main`._

## Context

**Where we are:** All three foundational PRs are merged to `main` — #19 (FAQ/guides), #20 (Astro multi-site + Sveltia CMS), #21 (EmailJS tour-form wiring). Production is **still serving the old root `index.html`** because Cloudflare Pages has no build step set. Visitors see nothing new until you flip three Pages settings; merging PRs doesn't change the live site by itself, by design.

Magnolia's per-site files (`src/sites/magnolia-crestview/*`) already carry real content — units, address, contact, SEO, theme. The remaining work is: paste in real photos, real floor-plan images, real Matterport URLs, real EmailJS IDs, any final copy tweaks, then flip Cloudflare and attach the domain.

---

## The launch sequence at a glance

| Phase | Who | Time | What |
|---|---|---|---|
| 1. Pre-launch polish | You + me (parallel) | ~1–2 hrs | EmailJS IDs, photos, floor plans, availability, copy tweaks |
| 2. Cutover | You, in Cloudflare | ~5 min | Flip 3 Pages settings, smoke-test, attach custom domain |
| 3. Live | Both, ongoing | — | Content edits → PR → auto-deploy |

Recommended to finish all of Phase 1 before Phase 2 so the launch is fully polished and no tour leads are lost during a gap.

---

## Phase 1 — Pre-launch polish

Each sub-task is independent. Do them in any order. Each lands as its own PR against `main`, visible in the Cloudflare branch preview before merge.

### 1a. EmailJS — turn the tour form on (your ~10 min, then paste IDs to me)

Today the form animates "Thanks ✓" but doesn't send. Without this, any tour request submitted on launch day is **lost**.

1. emailjs.com → sign up → Account → copy **Public Key**
2. Email Services → Add Service (Gmail with `leasing@agmrealestategroup.com` is simplest) → copy **Service ID**
3. Email Templates → New Template, with:
   - **To Email:** `{{to_email}}`
   - **Reply To:** `{{lead_email}}`
   - **Subject:** `Tour request — {{lead_first_name}} {{lead_last_name}} — {{property_name}}`
   - **Body:** the template given in PR #21's description (Name / Email / Phone / Bedrooms / Move-in / Tour time / Source / Page / Message)
   - Save → copy **Template ID**
4. Account → Security → restrict the Public Key to your Magnolia domain(s)
5. Paste **Public Key, Service ID, Template ID** to me → I commit them into `src/sites/magnolia-crestview/site.config.json` `integrations.emailjs`

### 1b. Photos (drop in chat → I wire them)

Drop image files into the chat. For each, tell me:
- **Category:** `interior` / `exterior` / `units` / `neighborhood`
- **Display size:** `hero` (big), `wide`, `tall`, or `square` — I'll pick if unsure
- **One-line caption** (shown in the gallery + lightbox)

I'll save them under `public/uploads/magnolia-crestview/<file>` and rewrite `src/sites/magnolia-crestview/photos.json` with `src`, `title`, `desc`, `cat`, `size` per photo. The gallery + lightbox light up automatically.

### 1c. Floor plans + 3D tours (drop files / paste links → I wire them)

- **Floor plan images:** drop a 1BR and a 2BR floor-plan image; I save them and set `site.config.json` `floorPlans.1br.image` and `floorPlans.2br.image`.
- **Matterport (or other) 3D tour URLs:** paste the embed URL for each plan; I set `floorPlans.1br.tourUrl` and `floorPlans.2br.tourUrl`. The existing 3D-tour tab loads them in an iframe.

### 1d. Availability / pricing updates (paste table → I rewrite `units.json`)

Paste the current rent roll (e.g., from a sheet — unit id, beds/baths, sqft, rent, floor, status, features). I'll rewrite `src/sites/magnolia-crestview/units.json`.

### 1e. Copy tweaks (paste text → I edit `body.html`)

For changes to hero, FAQ, neighborhood blurb, floor-plan narratives, footer, etc. — paste the new text and tell me where it goes. I'll edit `src/generated/body.html` and **flag each edit as part of the planned "lift narrative copy into per-site config" refactor** we'll do before onboarding site #2.

---

## Phase 2 — Cutover (your ~5 min in Cloudflare)

This is the moment production switches from the old `index.html` to the new Astro build.

1. **Cloudflare Pages → your Magnolia project → Settings → Builds & deployments:**
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
2. **Settings → Environment variables:** add `SITE=magnolia-crestview` to **Production** and **Preview**.
3. **Trigger a new deploy** (push any trivial commit, or click "Retry deployment").
4. **Smoke-test the `.pages.dev` URL.** Click through: gallery + lightbox, map + bus routes, commute estimator, 3-step tour wizard (submit + check the email lands), floating widget leasing + maintenance, FAQ accordion, guides at `/guides/...`, all three calculators. View source: confirm OG tags, JSON-LD, canonical URL.
5. **Custom Domains** → attach your Magnolia domain. Update DNS as Cloudflare instructs.
6. **Verify on the live domain.** Hit `/robots.txt`, `/sitemap.xml`, `/site.webmanifest` — all generated from config.

**Rollback if anything looks off:** Pages settings → blank out the build command + output dir → Pages immediately falls back to serving the old root `index.html`. Reversible in under a minute.

---

## Phase 3 — Live + iterating

Same loop, forever:

1. You drop new content / updates in chat.
2. I edit only the per-site files (`src/sites/magnolia-crestview/*`, `public/uploads/magnolia-crestview/*`) — or `body.html` for now if it's narrative copy, flagged for the future refactor.
3. I push to a content branch, open a PR, you eyeball the branch preview, merge.
4. Cloudflare auto-deploys → live in ~1 min.

**When you want to activate the Sveltia CMS** (so your team can edit without going through me): follow the 4-step setup in PR #20's description (OAuth app + Cloudflare Worker + `base_url`). Independent of launch.

---

## What to paste/drop to me to kick off Phase 1

To start in one batch, send whatever subset of these is ready:

- [ ] EmailJS Public Key + Service ID + Template ID
- [ ] Photos (drag the files into chat), each with category + caption
- [ ] 1BR + 2BR floor-plan images (drag in)
- [ ] 1BR + 2BR 3D-tour embed URLs (paste)
- [ ] Current availability/pricing table (paste)
- [ ] Any copy tweaks (paste, with "where this goes" hint)
- [ ] Target custom domain (if a redirect or `domain` pre-check in `site.config.json` is needed)

Not everything is needed at once — drop what's ready and the rest gets batched as it lands.

---

## Verification (per phase)

**After each Phase-1 content batch:** `npm run build` locally → branch preview renders the change → confirm before merge.

**After Phase-2 cutover:** the click-through smoke test above. The body markup is byte-identical to today's `index.html` (verified at migration time), so visually the page should be familiar; the difference is everything is now config-driven.

**After Phase-3 edits:** Cloudflare's preview-per-PR + the standard smoke-test of the area touched.

---

## Critical files

**Edit freely (per-site, safe):**
- `src/sites/magnolia-crestview/site.config.json` — identity, contact, address, SEO, theme, floor plans, EmailJS keys, analytics keys
- `src/sites/magnolia-crestview/units.json` — availability + pricing
- `src/sites/magnolia-crestview/photos.json` — gallery (with `src` per photo)
- `src/sites/magnolia-crestview/places.json` — neighborhood pins
- `public/uploads/magnolia-crestview/` — image files

**Gray zone (safe today because Magnolia is the only site; refactor before site #2):**
- `src/generated/body.html` — hero, FAQ, plan narratives, neighborhood intro, footer
- Two remaining hardcoded property strings in `public/app.js` (map popup line 715, commute label line 1152), flagged in PR #21

**Shared template (don't touch for content):**
- `src/layouts/BaseLayout.astro`, `src/components/Analytics.astro`, `src/styles/global.css`

---

## After Magnolia launches

When ready for **site #2** (and the next 5 after that), three things kick in:

1. **Lift Magnolia's narrative copy out of `body.html` into `site.config.json` `copy`** — replace inline text with template variables. One-time mechanical refactor; renders identically for Magnolia, gives every future site its own narrative.
2. **`/new-property` scaffold** — a script + intake skill so dropping a new property's content into chat creates the new `src/sites/<id>/` folder, Cloudflare Pages project, and config automatically.
3. **Activate Sveltia CMS** so leasing/marketing edits content directly via web forms instead of through Claude.
