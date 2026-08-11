# Per-site images

Files here are copied to the site root at build time: `images/hero.jpg` is served
as `/images/hero.jpg`.

## How to add photos

1. Upload files to this folder on the working branch (GitHub → **Add file →
   Upload files**), using the exact filenames below.
2. That's it. Every slot is already wired — `photos.json`, `site.config.json`
   and the hero all reference these paths.

Upload whatever you have (PNG, HEIC, large originals); they get optimised
before merge. Any file not supplied yet simply shows the "Photography coming
soon" placeholder, so partial uploads are fine.

## Standalone images

| File | Used by | Notes |
|---|---|---|
| `hero.jpg` | Hero visual | ✅ supplied. Landscape; ≥2000px wide is ideal. |
| `og.jpg` | Social share preview | 1200×630. Set `seo.ogImage` to `/images/og.jpg` once added. |

## Floor plans

| File | Used by |
|---|---|
| `floorplans/1br.png` | Floor plan drawing for the 1br layout |
| `floorplans/2br.png` | Floor plan drawing for the 2br layout |

### Plan photos

Representative photos of each layout. Shown in the unit detail modal when a
home of that plan is opened, so a 2 BR shows 2 BR photos.

Where a room is identical across layouts it is shared rather than duplicated —
the Kitchen tile for both plans points at `gallery/interior-updated-kitchen.jpg`,
so there is no `plans/*-kitchen.jpg` to upload.

| File | Shows |
|---|---|
| `plans/1br-living.jpg` | 1br — Living area |
| `plans/1br-bedroom.jpg` | 1br — Bedroom |
| `plans/1br-bath.jpg` | 1br — Bathroom |
| `plans/2br-living.jpg` | 2br — Living area |
| `plans/2br-primary-bedroom.jpg` | 2br — Primary bedroom |
| `plans/2br-second-bedroom.jpg` | 2br — Second bedroom |
| `plans/2br-bath.jpg` | 2br — Bathroom |

## Gallery

24 slots, 6 per category. Filenames are referenced by `photos.json` → `src`.

**Interior** (6)

| File | Shows |
|---|---|
| `gallery/interior-updated-kitchen.jpg` | ✅ supplied. Updated kitchen — also reused as the Kitchen tile for both floor plans |
| `gallery/interior-living-area.jpg` | ✅ supplied. Living area — Generous proportions, natural light through the day |
| `gallery/interior-primary-bedroom.jpg` | ✅ supplied. Primary bedroom — A real bedroom — generous size, abundant closet |
| `gallery/interior-bathroom.jpg` | Bathroom — Updated fixtures, full tub-and-shower combo |
| `gallery/interior-dining.jpg` | Dining — Open to the kitchen and living area |
| `gallery/interior-second-bedroom.jpg` | Second bedroom — Roommate-friendly — equal in size with its own closet |

**Exterior** (6)

| File | Shows |
|---|---|
| `gallery/exterior-building-facade.jpg` | Building facade — A quiet residential street in the heart of Magnolia |
| `gallery/exterior-the-approach.jpg` | The approach — Mature trees and tree-lined sidewalks |
| `gallery/exterior-original-architecture.jpg` | Original architecture — Mid-century forms, carefully maintained |
| `gallery/exterior-private-deck.jpg` | Private deck — Built-in storage, skyline views from upper floors |
| `gallery/exterior-garden-side.jpg` | Garden side — Quiet shared outdoor space |
| `gallery/exterior-covered-parking.jpg` | Covered parking — Covered + uncovered options on-site |

**Units** (6)

| File | Shows |
|---|---|
| `gallery/units-unit-407.jpg` | Unit 407 — 2 BR · 2 BA · 1,000 sqft · Top floor · $1,995/mo |
| `gallery/units-unit-306.jpg` | Unit 306 — 1 BR · 600 sqft · Private deck · $1,695/mo |
| `gallery/units-unit-103.jpg` | Unit 103 — 1 BR · 600 sqft · Ground floor · $1,595/mo |
| `gallery/units-built-in-storage.jpg` | Built-in storage — Closets and shelving throughout |
| `gallery/units-unit-402.jpg` | Unit 402 — 2 BR · 2 BA · 1,000 sqft · Upper floor · Skyline views |
| `gallery/units-unit-203.jpg` | Unit 203 — 1 BR · 600 sqft · Second floor · $1,595/mo |

**Neighborhood** (6)

| File | Shows |
|---|---|
| `gallery/neighborhood-discovery-park.jpg` | Discovery Park — 534 acres of trails, beach, and old-growth forest |
| `gallery/neighborhood-magnolia-village.jpg` | Magnolia Village — Shops, cafés, weekend farmers market |
| `gallery/neighborhood-seattle-skyline.jpg` | Seattle skyline — Visible from upper-floor decks |
| `gallery/neighborhood-puget-sound.jpg` | Puget Sound — Waterfront walks and beach access |
| `gallery/neighborhood-local-cafe.jpg` | Local café — One of many independents in Magnolia Village |
| `gallery/neighborhood-ballard.jpg` | Ballard — 10 min away — restaurants, breweries, Sunday market |
## Notes

- Landscape orientation crops best (gallery cards are 4:3).
- Keep names exactly as listed — they're referenced by `photos.json`.
- To change a caption, edit `title`/`desc` in `photos.json`, not the filename.
- Large photo sets are better served from object storage; point `src` at those
  URLs instead of committing binaries.
