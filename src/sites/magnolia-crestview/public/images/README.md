# Per-site images

Files here are served from the site root. `images/hero.jpg` becomes `/images/hero.jpg`.

## Expected files

| File | Used by | Notes |
|---|---|---|
| `hero.jpg` | Hero visual | Referenced by `site.config.json` → `hero.image`. Landscape, ideally ≥2000px wide. Until it exists the hero falls back to the illustrated skyline. |
| `og.jpg` | Social share preview | Set `seo.ogImage` to `/images/og.jpg`. 1200×630. |
| `gallery/*.jpg` | Photo gallery | Referenced by `photos.json` entries via a `src` field. |
| `floorplans/*.png` | Floor plans | Referenced by `site.config.json` → `floorPlans.<plan>.image`. |

## Naming

Lowercase, hyphenated, category-prefixed so files are self-describing:

```
hero.jpg
og.jpg
gallery/interior-kitchen-01.jpg
gallery/exterior-building-01.jpg
floorplans/2br2ba.png
```

Optimise before committing (resize to the largest size actually rendered, then
compress). Large photo sets are better served from object storage — point the
JSON at those URLs instead of committing the binaries.
