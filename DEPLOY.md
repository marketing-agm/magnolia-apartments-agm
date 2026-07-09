# Deploying to Cloudflare Pages

One Cloudflare Pages **project per property**, all pointing at this one repo. The
only thing that differs between projects is the `SITE` environment variable.

This is the repeatable playbook for every property (Magnolia today, sites #2–40
next). It uses **dashboard Git integration** — no API token, no CI secrets.

## Prerequisites

- The repo `marketing-agm/magnolia-apartments-agm` is on GitHub (it is).
- A Cloudflare account with access to **Workers & Pages**.
- The site folder exists at `src/sites/<id>/` (Magnolia: `magnolia-crestview`).

## First launch — Magnolia Crestview (on the free `*.pages.dev`)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → pick `marketing-agm/magnolia-apartments-agm`.
2. Configure the build:
   - **Production branch:** `main`
   - **Framework preset:** Astro (or "None")
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. **Environment variables** → add for **Production** (and Preview if you want
   branch previews):
   - `SITE = magnolia-crestview`
   - `NODE_VERSION = 20` (Astro 5 needs Node ≥ 18.20 / 20)
4. **Save and Deploy.** The first build publishes to
   `https://<project>.pages.dev`. That URL already matches
   `site.config.json → domain`, so canonical/OG/sitemap are correct.
5. Visit the `.pages.dev` URL and confirm the page renders (placeholder photos
   are expected — see "Photos" below). Also check `/admin` loads.

> **Cutover note:** production currently serves the old root `index.html` with
> **no build step**. Merging this branch does not change the live site by
> itself — switching the Pages **build command** to `npm run build` and
> **output** to `dist` (steps above) is what cuts over to the Astro build.

## Adding a custom domain later

Pages project → **Custom domains** → **Set up a domain**. If the domain is
already in this Cloudflare account, DNS is wired automatically; otherwise point
its nameservers/CNAME at Cloudflare first. Then update
`src/sites/<id>/site.config.json → domain` to the final `https://…` URL and
redeploy (canonical/OG/sitemap follow the config).

## Adding a new property (sites #2–40)

```bash
npm run new-site <new-id> --name "Property Name"   # scaffolds src/sites/<new-id>
# edit src/sites/<new-id>/site.config.json  (brand, contact, address, geo, theme, copy)
# add units/photos/places (edit JSON or use /admin)
npm run gen-cms                                     # registers it in the CMS editor
SITE=<new-id> npm run build                         # verify it builds locally
```

Then repeat the **Create a Pages project** steps above with
`SITE = <new-id>` and that property's domain.

### Only rebuild what changed

In each Pages project, set **Build watch paths** so a push that only touches one
property rebuilds only that project:

- Include: `src/sites/<id>/**`
- Include the shared template: `src/**` (excluding other sites), `public/**`,
  `astro.config.mjs`, `package.json`

A push that touches the shared template rebuilds every project (intended — a
template fix should reach all sites); a push that touches only one site's folder
rebuilds just that project.

## `/admin` (optional, one-time)

The visual editor at `/admin` commits to this repo via GitHub, which needs an
OAuth relay — see the **Admin portal** section of `README.md`. One admin
instance edits the repo for all properties.

## Photos

The site currently renders dynamic placeholder images. Real photos are added
per property later via `/admin` (they land in `public/uploads` and are written
into `photos.json`). At portfolio scale, switch `media_folder` in
`public/admin/config.yml` to external storage (Cloudflare R2 / Cloudinary) so
the repo stays lean.

## Build settings reference

| Setting            | Value                          |
| ------------------ | ------------------------------ |
| Build command      | `npm run build`                |
| Output directory   | `dist`                         |
| Production branch   | `main`                        |
| Env: `SITE`        | the `src/sites/<id>` folder name |
| Env: `NODE_VERSION`| `20`                           |
