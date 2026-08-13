# Floor plans & 3D tours — how they're wired, and how to add them

Covers where floor-plan drawings and Matterport (or any other) 3D tours live,
what's shared across every property versus what's per-property, and the exact
steps to add them to a new site.

---

## The short answer

**Everything property-specific lives in that property's own folder.** Nothing
about Magnolia's tour is in the shared template.

| What | Where | Scope |
|---|---|---|
| Tour URL | `src/sites/<id>/site.config.json` → `floorPlans.<plan>.tourUrl` | **Per-property** |
| Floor-plan drawing | `src/sites/<id>/public/images/floorplans/<plan>.png` | **Per-property** |
| Drawing path | `site.config.json` → `floorPlans.<plan>.image` | **Per-property** |
| The iframe, tabs, placeholder | `src/generated/body.html` | Shared |
| Load/swap logic | `public/app.js` | Shared |
| Conversion tracking | `src/components/Analytics.astro` + `app.js` | Shared |

Verify at any time that no property's tour has leaked into the template:

```bash
# should return only the property's own site.config.json
grep -rn "matterport" src/ public/ --exclude-dir=node_modules
```

The shared template contains the *string* "matterport" in exactly one
functional place — a CSS selector in `Analytics.astro` that catches clicks on
Matterport **anchor links** anywhere on the page. That's a safety net for links
outside the floor-plan panel, not a hardcoded URL, and it doesn't tie you to
Matterport: the panel's own tracking fires from `applyTourSrc()` and is
provider-agnostic.

---

## How the linking actually works

```
site.config.json
  floorPlans["2br"].tourUrl
        │
        ▼
BaseLayout.astro  ──  copies config.floorPlans into window.__SITE__
        │
        ▼
app.js  applyFloorPlanConfig()
        │   writes data-tour<Plan> onto .plan-view-3d
        │   e.g. "2br" -> data-tour2br, "studio" -> data-tourStudio
        ▼
app.js  applyTourSrc()
        │   on tab change, reads the attribute for the active plan
        ▼
   <iframe class="plan-tour-iframe" src="...">   ← tour renders
```

Two behaviours worth knowing:

- **No `tourUrl` set ⇒ the tab shows "3D Tour Coming Soon."** That's the intended
  state, not a bug. Never point a plan at another plan's tour to fill the gap —
  a renter who tours the wrong layout is worse than one who tours none.
- **`tour_3d_opened` fires only when a tour actually appears on screen**, once
  per plan per pageview. Clicking the tab while it still says "Coming Soon" is
  not a tour view and isn't counted. This is a Google Ads conversion action, so
  inflating it would corrupt bidding.

---

## Adding a 3D tour to a property

1. **Get the share link** from Matterport: open the space → Share → copy the
   link. It looks like:
   ```
   https://my.matterport.com/show/?m=XXXXXXXXXXX
   ```
   The `m=` value is the space ID. That URL works directly as an iframe `src`;
   no separate "embed code" is needed — paste the plain share link.

2. **Set it in the property's config**, under the matching plan key:
   ```json
   "floorPlans": {
     "2br": {
       "image": "/images/floorplans/2br.png",
       "tourUrl": "https://my.matterport.com/show/?m=XXXXXXXXXXX"
     }
   }
   ```

3. **Build and click the 3D tab** to confirm it loads:
   ```bash
   SITE=<site-id> npm run build && npm run preview
   ```

**Optional — skip the start screen.** Appending `&play=1` drops visitors
straight into the walkthrough instead of a click-to-start splash:
```
https://my.matterport.com/show/?m=XXXXXXXXXXX&play=1
```
Worth considering for pages taking paid traffic — fewer clicks between the ad
and the content. Magnolia currently runs **without** it.

**Other providers work too.** Any URL that renders in an iframe is fine
(Zillow 3D Home, CloudPano, a YouTube embed). The field isn't Matterport-specific.
The iframe carries `allow="xr-spatial-tracking; fullscreen"`. If a provider
refuses to load, check its `X-Frame-Options` / `frame-ancestors` policy — some
block embedding entirely, and that failure is silent.

---

## Adding a floor-plan drawing

1. Save the image to `src/sites/<id>/public/images/floorplans/<plan>.png`.
   **Use the plan key as the filename and avoid spaces** — spaces need URL
   encoding and break in subtle places.
2. Point the config at it: `floorPlans.<plan>.image = "/images/floorplans/<plan>.png"`.
3. **Leave `image` as `""` if you don't have the drawing yet.** A path to a file
   that doesn't exist used to hide the placeholder and leave a broken image;
   there's now an error fallback, but an empty string is still the honest way to
   say "not yet."

---

## Copy-paste prompt for a new property

> Wire the 3D tour and floor plan for `<property-name>` (site id `<site-id>`).
>
> - Tour URL for the `<plan-key>` plan: `<paste share link>`
> - Floor-plan image: attached / at `<path>`
>
> Set `floorPlans.<plan-key>.tourUrl` and `.image` in
> `src/sites/<site-id>/site.config.json`. Save the drawing to
> `src/sites/<site-id>/public/images/floorplans/<plan-key>.png`.
> Leave any plan without assets as `""` so it shows the "Coming Soon"
> placeholder. Build with `SITE=<site-id>` and confirm the 3D tab loads the
> tour and the floor-plan tab shows the drawing. Don't touch shared template
> files — this should be a per-site config change plus an image.

---

## Known limitation before property #2

**The floor-plan tabs are hardcoded in the shared `body.html`** as exactly two:
`data-plan="1br"` and `data-plan="2br"`, with matching hand-written copy blocks
(square footage, narrative, feature lists).

The *config* side is fully general — `applyFloorPlanConfig()` iterates whatever
plan keys a site defines, so a `studio` or `3br` tour wires up correctly. But
there's no **tab** for it to appear under, so nothing renders.

Practically: a property whose layouts are 1BR + 2BR works today with no template
changes. A property with a studio, a 3BR, or a single layout needs the plan
tabs and their copy lifted out of `body.html` into per-site config. That's the
same refactor the README already flags for narrative copy — worth doing once,
before onboarding a property that needs it, rather than forking `body.html`.
