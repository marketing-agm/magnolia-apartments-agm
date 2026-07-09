// Scaffold a new property from an existing one.
//
//   node scripts/new-site.mjs <new-id> [--name "Property Name"]
//                             [--from magnolia-crestview] [--keep-data]
//
// Copies src/sites/<from> -> src/sites/<new-id>, rewrites identity fields in the
// new site.config.json, and (by default) blanks the data files so you don't ship
// another property's units/photos. Never overwrites an existing site folder.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sitesDir = join(root, 'src', 'sites');

// ---- args
const args = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--keep-data') flags.keepData = true;
  else if (a === '--name') flags.name = args[++i];
  else if (a === '--from') flags.from = args[++i];
  else if (a.startsWith('--')) { console.error(`Unknown flag: ${a}`); process.exit(1); }
  else positional.push(a);
}

const id = positional[0];
const from = flags.from || 'magnolia-crestview';

if (!id) {
  console.error('Usage: node scripts/new-site.mjs <new-id> [--name "Name"] [--from <id>] [--keep-data]');
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(id)) {
  console.error(`Invalid id "${id}" — use lowercase letters, digits, and hyphens only.`);
  process.exit(1);
}

const srcDir = join(sitesDir, from);
const destDir = join(sitesDir, id);
if (!existsSync(srcDir)) { console.error(`Source site not found: src/sites/${from}`); process.exit(1); }
if (existsSync(destDir)) { console.error(`Refusing to overwrite existing site: src/sites/${id}`); process.exit(1); }

// Title-case the id if no --name given.
const name = flags.name || id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const shortName = name.split(' ').slice(-1)[0];

mkdirSync(destDir, { recursive: true });

const DATA_SKELETONS = {
  'units.json': { units: [] },
  'places.json': { places: [] },
  'photos.json': { photos: [] },
  'bus-stops.json': [],
};

for (const file of readdirSync(srcDir)) {
  const raw = readFileSync(join(srcDir, file), 'utf8');

  if (file === 'site.config.json') {
    const cfg = JSON.parse(raw);
    cfg.id = id;
    cfg.name = name;
    cfg.shortName = shortName;
    if (cfg.brand) cfg.brand = { pre: name, em: '' };
    cfg.domain = `https://${id}.pages.dev`;
    if (cfg.seo) cfg.seo.ogImage = '';
    // Don't leak the source property's keys/URLs into a new site.
    if (cfg.integrations) {
      for (const k of ['orsApiKey', 'appfolioUrl', 'mapsUrl']) if (k in cfg.integrations) cfg.integrations[k] = '';
    }
    if (cfg.analytics) {
      if (cfg.analytics.posthog) cfg.analytics.posthog.key = '';
      if (cfg.analytics.clarity) cfg.analytics.clarity.id = '';
    }
    writeFileSync(join(destDir, file), JSON.stringify(cfg, null, 2) + '\n');
    continue;
  }

  if (!flags.keepData && file in DATA_SKELETONS) {
    writeFileSync(join(destDir, file), JSON.stringify(DATA_SKELETONS[file], null, 2) + '\n');
    continue;
  }

  writeFileSync(join(destDir, file), raw);
}

console.log(`✓ Created src/sites/${id} (from ${from})`);
console.log(`\nNext steps:`);
console.log(`  1. Edit src/sites/${id}/site.config.json — brand, contact, address, geo, theme, copy.`);
console.log(`  2. Add units / photos / places (edit the JSON or use /admin).`);
console.log(`  3. node scripts/gen-cms-config.mjs   # register ${id} in the CMS`);
console.log(`  4. SITE=${id} npm run build          # verify it builds`);
console.log(`  5. Create a Cloudflare Pages project with env SITE=${id} (see DEPLOY.md).`);
