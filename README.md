# Magnolia Crestview

Single-page property marketing website for Magnolia Crestview apartments in Seattle, WA. One self-contained HTML file — no build step.

## Deploy to Cloudflare Pages

### Option A — GitHub + auto-deploy (recommended)

Every `git push` redeploys the site automatically.

1. Create a new GitHub repo (public or private — both work):
   ```bash
   cd magnolia-crestview-site
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/magnolia-crestview.git
   git push -u origin main
   ```
2. Go to **Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git**
3. Authorize GitHub, select the repo, and configure:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
4. Click **Save and Deploy**. ~30 seconds later you have a `<project>.pages.dev` URL.

### Option B — Direct upload (fastest, no Git)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Upload assets**
2. Drag the entire `magnolia-crestview-site` folder onto the upload area
3. Click **Deploy site**

### Option C — Wrangler CLI

```bash
npx wrangler pages deploy . --project-name=magnolia-crestview
```

## Custom domain

In the Pages project: **Custom domains → Set up a custom domain**. If your domain's DNS is already on Cloudflare, it's one click. Otherwise add the CNAME they provide at your DNS host.

## Local preview

```bash
open index.html
# or any: python3 -m http.server 8000
```

## Editing

All content lives inline in `index.html`:

| What | Where to find it |
| --- | --- |
| Photos | `const PHOTOS = [...]` near the bottom JS block |
| Available units | `const UNITS = [...]` |
| Neighborhood places | `const PLACES = [...]` |
| Floor plan SVGs | Inside `<div class="plan-svg-wrap">` |
| Copy & headlines | Inline in each `<section>` markup |
| Colors & fonts | `:root { ... }` at the top of the `<style>` block |

Replace Unsplash `imgId` values in `PHOTOS` with real property photos when ready — the Picsum `seed` is just a fallback.

## Conversion tools

The Available homes and Pricing sections include prospect-facing helpers, all driven off the same `UNITS` data:

- **Save / shortlist** — heart any home; saved units persist in the browser (`localStorage` key `mc_favs`) and surface in a sticky bar + drawer that hands the selection off to the tour booking flow.
- **Compare** — pick 2–3 homes (`vs` button) to see them side by side, including price per square foot.
- **Budget filter** — entering an annual income flags homes within the 30%-of-income guideline.
- **Move-in cost calculator** (Pricing section) — exact "due at signing" total for a chosen home, adults, and the 1-month-free special.
- **"Only X left" badges** — appear automatically when 2 or fewer available homes share the lowest price for a plan. They stay dormant while inventory is healthy — this is intentional (honest scarcity, no fabricated counts).

### Commute estimator (optional API key)

The Neighborhood section has a commute estimator. Out of the box it geocodes the typed address via OpenStreetMap **Nominatim** and shows a clearly-labeled straight-line **approximation** for drive/bike/walk times — no key required.

For precise routing, drop a free [OpenRouteService](https://openrouteservice.org/dev/#/signup) key into `const ORS_API_KEY = ''` inside the commute estimator JS. Restrict the key by HTTP referrer in the ORS dashboard (it is visible in client-side code). If a routing call fails or times out, it falls back to the approximation automatically.

## External dependencies

These load from CDN at runtime (no build needed, but the site requires internet to render fully):

- Google Fonts (Fraunces, Geist, JetBrains Mono)
- Leaflet 1.9.4 (`cdnjs.cloudflare.com`)
- CartoDB Positron map tiles
- Unsplash + Picsum (sample images, swap with your own)
- OpenStreetMap Nominatim (commute estimator geocoding)
- OpenRouteService (commute estimator routing — only if you add an `ORS_API_KEY`)

## License

Code: do whatever. Photos shown are placeholder stock — replace before going live.
