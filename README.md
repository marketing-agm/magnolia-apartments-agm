# Apartment marketing sites — shared template

One Astro template that renders many property marketing sites. Each property is a
folder of content/config; the template (markup, styles, app logic) is shared, so
a change to the template propagates to every site, while a change to one
property's folder affects only that site.

Magnolia Crestview is the first site (`src/sites/magnolia-crestview`).

## How it's organized

```
src/
  sites/<id>/            ← one folder per property (the per-site surface)
    site.config.json     ← identity, address, geo, theme colors, SEO, analytics IDs
    units.json           ← availability / pricing / floor plans
    places.json          ← neighborhood places
    photos.json          ← gallery
    bus-stops.json       ← transit points for the map
    public/              ← per-site static files copied verbatim into the build
      guides/            ←   standalone guide pages (/guides/...)
      assets/guide.css   ←   styles for the guide pages
      llms.txt           ←   /llms.txt for AI crawlers
  layouts/BaseLayout.astro   ← <head>: SEO, Open Graph, JSON-LD, theme — all from config
  components/Analytics.astro  ← PostHog + Clarity + conversion-event taxonomy
  styles/global.css      ← shared styles (theme colors overridden per site)
  generated/body.html    ← shared page markup (produced by scripts/migrate.mjs)
  pages/                 ← index + dynamic robots.txt / sitemap.xml / site.webmanifest
public/                  ← shared static files for every site (app.js, favicon, _headers, /admin)
  app.js                 ← shared client logic (reads its data from window.__SITE__)
```

Two static-file surfaces: shared `public/` ships with every site, while
`src/sites/<id>/public/` ships only with that property (copied into the build by
a small integration in `astro.config.mjs`). On a path collision the per-site file
wins.

**Never hardcode a site's own absolute URL in `src/sites/<id>/public/`.** Write
`{{SITE_DOMAIN}}` instead — the build substitutes `site.config.json → domain`
into every copied `.html/.txt/.xml/.json/.css/.js/.md`. Astro templates read the
config directly, but these files are copied byte-for-byte, so a literal host
would survive a custom-domain migration and leave guide canonicals and
`llms.txt` pointing at the old hostname — telling Google the wrong URL is
authoritative. Changing a property's domain should be a one-line config edit.

The original single-file `index.html` is kept at the repo root as the source the
migration script slices from. It is **not** deployed — production serves the
Astro build in `dist/`.

## Run locally

```bash
npm install
npm run dev          # http://localhost:4321  (defaults to magnolia-crestview)
npm run build        # outputs static site to dist/
npm run preview      # serve the built dist/
```

Pick which site to build/serve with the `SITE` env var (the folder name):

```bash
SITE=magnolia-crestview npm run build
```

## Add a new property (the path to 45 sites)

1. `cp -r src/sites/magnolia-crestview src/sites/<new-id>`
2. Edit `<new-id>/site.config.json` — name, domain, address, geo, theme colors,
   SEO copy, analytics IDs, and the `sitemap.pages` list (extra URLs like guides).
3. Add floor-plan drawings and 3D tour URLs — see
   `docs/content/floor-plans-and-tours.md` for where they live, how the linking
   works, and a copy-paste prompt. Both are **per-site**; nothing about a
   property's tour belongs in the shared template.
4. Replace `units.json` / `places.json` / `photos.json` / `bus-stops.json` with
   that property's data. Heavy assets (photos, 3D tours) should point at object
   storage (e.g. Cloudflare R2/Images), not be committed here.
5. Update `<new-id>/public/` — swap in that property's guides, `llms.txt`, and any
   property-specific static files (or delete the ones you don't need).
6. Add `<new-id>` to the `site` matrix in `.github/workflows/build.yml` so CI
   verifies its build.
7. `SITE=<new-id> npm run build` and deploy (below).

Template-wide changes (anything in `layouts/`, `components/`, `styles/`,
`generated/`, `public/app.js`) automatically apply to every site on its next build.

## Deploy to Cloudflare Pages — one project per property

Create a Pages project per site, all pointing at this repo:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Environment variable:** `SITE=<folder-name>`
- **Custom domain:** that property's domain

A push that touches the template rebuilds all sites; a push that touches one
site's folder rebuilds only that project (set each project's build-watch paths to
`src/sites/<id>` + the shared template folders).

### Cutover status (Magnolia) — done

Magnolia is **live on the Astro build**. The Pages project runs `npm run build`,
and the output directory is pinned as config-as-code in `wrangler.toml`
(`pages_build_output_dir = "./dist"`), so it can't be lost or reset in the
dashboard. The build command and the per-site `SITE` variable still live in the
Pages dashboard.

Practical consequence: **a merge to `main` changes the live site.** Template
edits (`layouts/`, `components/`, `styles/`, `generated/`, `public/app.js`) ship
to production on the next deploy, so preview them on a branch deploy first.

The root `index.html` is **not deployed** — it's kept only as the source
`scripts/migrate.mjs` slices from. Editing it has no effect on the live site.

## Analytics

Wired once in `components/Analytics.astro`, inherited by every site. Drop per-site
keys into `site.config.json → analytics`:

- **PostHog** (`analytics.posthog.key` / `host`) — autocapture, funnels, session
  replay, per-site + portfolio dashboards. Every event is tagged with `site_id`
  so you get both a single-property view and a portfolio rollup.
- **Microsoft Clarity** (`analytics.clarity.id`) — free heatmaps + session replay.
- **Google** (`analytics.google.ga4Id` / `adsId`) — GA4 and Google Ads via one
  `gtag.js` load. GA4 receives every event; Google Ads receives only the events
  you give a conversion label in `analytics.google.conversionLabels`, so paid
  bidding optimizes toward real leads instead of micro-interactions.
  `conversionValues` sets each action's relative worth for Smart Bidding.
  Paid clicks are stamped: `gclid`/`wbraid`/`gbraid` and `utm_*` are stored for
  90 days and exposed via `window.getAdAttribution()`, which also appends
  `ad_source` / `ad_campaign` / `ad_keyword` / `ad_click_id` to every lead email.

  Campaign setup for Magnolia — structure, keywords, negatives, ad copy, budget:
  `docs/plans/2026-08-07-magnolia-google-ads-playbook.md`.

With no keys set, nothing loads (safe no-op). Named conversion events fire
automatically off existing interactions: `tour_requested`, `unit_favorited`,
`floor_plan_viewed`, `commute_estimated`, `gallery_opened`, `tour_3d_opened`,
`phone_click`, `email_click`, `maintenance_request`.

## Admin portal (visual editor for non-technical editors)

A git-based CMS ([Sveltia](https://github.com/sveltia/sveltia-cms)) lives at
**`/admin`**. Editors log in with GitHub and get forms — no code. Saving writes
back to the same JSON files in this repo as a commit, so edits flow through the
normal build/deploy. Git stays the single source of truth; you and the CMS edit
the same files.

What editors can change today (Magnolia): property settings (name, contact,
address, SEO, theme colors), **units & availability**, the **photo gallery
(with image upload)**, **floor-plan images + 3D-tour links** per plan, and
**neighborhood places**. Uploaded photos render in the gallery/lightbox; floor
plan images and Matterport tour URLs feed the floor-plans section.

### One-time setup

The CMS commits via the GitHub API, which needs an OAuth relay:

1. **GitHub OAuth app** — github.com → Settings → Developer settings → OAuth Apps
   → New. Set the callback URL to your auth worker's `/callback` (next step).
   Note the Client ID + Secret.
2. **Auth worker** — deploy the small
   [`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth) Cloudflare
   Worker; set `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` as its secrets.
3. **Point the CMS at it** — set `base_url` in `public/admin/config.yml` to your
   worker URL.
4. Visit `https://<your-site>/admin` and log in. (One admin instance is enough —
   it edits the repo, not a specific deployed site.)

### Media storage

Uploads currently commit to `public/uploads` (`media_folder` in `config.yml`).
That's fine to start, but at 45-site scale switch to external storage
(Cloudflare R2 / Cloudinary) so the repo stays lean — only the image *URL* is
then stored in the JSON.

### Approval gate (optional)

Editors publish straight to `main` by default. To require review, uncomment
`publish_mode: editorial_workflow` in `config.yml` — edits then become pull
requests instead of going live immediately.

### Scaling the CMS to every property

`config.yml` currently registers Magnolia's files. For each new site, add a file
entry under each collection pointing at `src/sites/<id>/…`. Because the structure
is identical per site, this is easily generated — a small script can rebuild
`config.yml` from the list of `src/sites/*` folders so all properties appear in
the editor automatically.

## Regenerating the shared parts

`scripts/migrate.mjs` slices the root `index.html` into `generated/body.html`,
`styles/global.css`, `public/app.js`, and the data JSON. It was a one-time
migration; you normally edit the generated/template files directly now. Re-run
with `npm run migrate` only if you intentionally rebuild from a new `index.html`.

## External dependencies (load from CDN at runtime)

Google Fonts, Leaflet 1.9.4, CartoDB map tiles, Unsplash/Picsum sample images,
OpenStreetMap Nominatim (commute geocoding), OpenRouteService (optional routing,
via `site.config.json → integrations.orsApiKey`).
