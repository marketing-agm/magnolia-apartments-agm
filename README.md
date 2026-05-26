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
  layouts/BaseLayout.astro   ← <head>: SEO, Open Graph, JSON-LD, theme — all from config
  components/Analytics.astro  ← PostHog + Clarity + conversion-event taxonomy
  styles/global.css      ← shared styles (theme colors overridden per site)
  generated/body.html    ← shared page markup (produced by scripts/migrate.mjs)
  pages/                 ← index + dynamic robots.txt / sitemap.xml / site.webmanifest
public/app.js            ← shared client logic (reads its data from window.__SITE__)
```

The original single-file `index.html` is kept at the repo root as the source the
migration script slices from. It is **not** what gets deployed once you cut over.

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
   SEO copy, and analytics IDs.
3. Replace `units.json` / `places.json` / `photos.json` / `bus-stops.json` with
   that property's data. Heavy assets (photos, 3D tours) should point at object
   storage (e.g. Cloudflare R2/Images), not be committed here.
4. `SITE=<new-id> npm run build` and deploy (below).

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

### Cutover note (Magnolia)

Production currently serves the root `index.html` with **no build step**. Merging
this branch does **not** change the live site by itself — it keeps serving the old
file until you switch the Pages build command to `npm run build` and output dir to
`dist`. So the migration is safe to merge first, cut over second.

## Analytics

Wired once in `components/Analytics.astro`, inherited by every site. Drop per-site
keys into `site.config.json → analytics`:

- **PostHog** (`analytics.posthog.key` / `host`) — autocapture, funnels, session
  replay, per-site + portfolio dashboards. Every event is tagged with `site_id`
  so you get both a single-property view and a portfolio rollup.
- **Microsoft Clarity** (`analytics.clarity.id`) — free heatmaps + session replay.

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
