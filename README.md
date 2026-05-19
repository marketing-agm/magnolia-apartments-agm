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

## External dependencies

These load from CDN at runtime (no build needed, but the site requires internet to render fully):

- Google Fonts (Fraunces, Geist, JetBrains Mono)
- Leaflet 1.9.4 (`cdnjs.cloudflare.com`)
- CartoDB Positron map tiles
- Unsplash + Picsum (sample images, swap with your own)

## License

Code: do whatever. Photos shown are placeholder stock — replace before going live.
