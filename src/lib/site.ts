// Resolves the active site at build time. Each Cloudflare Pages project sets
// SITE=<folder-name>; locally it defaults to magnolia-crestview.
const SITE_ID = process.env.SITE || 'magnolia-crestview';

const configs = import.meta.glob('../sites/*/site.config.json', { eager: true });
const units = import.meta.glob('../sites/*/units.json', { eager: true });
const places = import.meta.glob('../sites/*/places.json', { eager: true });
const photos = import.meta.glob('../sites/*/photos.json', { eager: true });
const busStops = import.meta.glob('../sites/*/bus-stops.json', { eager: true });

function pick(map: Record<string, any>, file: string) {
  const key = Object.keys(map).find((k) => k.includes(`/sites/${SITE_ID}/${file}`));
  if (!key) throw new Error(`[site] ${SITE_ID}/${file} not found`);
  return (map[key] as any).default;
}

export type SiteConfig = ReturnType<typeof getSite>['config'];

export function getSite() {
  const config = pick(configs, 'site.config.json');
  const data = {
    units: pick(units, 'units.json').units,
    places: pick(places, 'places.json').places,
    photos: pick(photos, 'photos.json').photos,
    busStops: pick(busStops, 'bus-stops.json'),
  };
  return { id: SITE_ID, config, data };
}
