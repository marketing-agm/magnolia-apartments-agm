// Resolves the active site at build time. Each Cloudflare Pages project sets
// SITE=<folder-name>; locally it defaults to magnolia-crestview.
const SITE_ID = process.env.SITE || 'magnolia-crestview';

const configs = import.meta.glob('../sites/*/site.config.json', { eager: true });
const units = import.meta.glob('../sites/*/units.json', { eager: true });
const places = import.meta.glob('../sites/*/places.json', { eager: true });
const photos = import.meta.glob('../sites/*/photos.json', { eager: true });
const busStops = import.meta.glob('../sites/*/bus-stops.json', { eager: true });
const faqs = import.meta.glob('../sites/*/faq.json', { eager: true });

function pick(map: Record<string, any>, file: string) {
  const key = Object.keys(map).find((k) => k.includes(`/sites/${SITE_ID}/${file}`));
  if (!key) throw new Error(`[site] ${SITE_ID}/${file} not found`);
  return (map[key] as any).default;
}

// Same as pick(), but for data a site may legitimately not have yet.
function pickOptional(map: Record<string, any>, file: string, fallback: any) {
  const key = Object.keys(map).find((k) => k.includes(`/sites/${SITE_ID}/${file}`));
  return key ? (map[key] as any).default : fallback;
}

export type SiteConfig = ReturnType<typeof getSite>['config'];

/** "+1-206-694-1713" -> "(206) 694-1713". Non-10-digit numbers pass through. */
export function formatPhone(raw: string | undefined): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  return digits.length === 10
    ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    : raw;
}

export function getSite() {
  const config = pick(configs, 'site.config.json');
  const data = {
    units: pick(units, 'units.json').units,
    places: pick(places, 'places.json').places,
    photos: pick(photos, 'photos.json').photos,
    busStops: pick(busStops, 'bus-stops.json'),
  };
  // FAQ is optional per site; an empty list simply renders no FAQ section.
  const faq = pickOptional(faqs, 'faq.json', { faq: [] }).faq || [];
  return { id: SITE_ID, config, data, faq };
}
