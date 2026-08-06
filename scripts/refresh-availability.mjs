// Refresh a site's units.json from the AGM availabilities feed.
//
// Source of truth is the AppFolio public listings, already parsed into a clean
// feed by the agm-availabilities app (listings.json). This script pulls that
// feed, filters to one property, and MERGES it into the site's units.json:
//
//   • AppFolio drives:   beds, baths, sqft, rent, available, availType
//   • Curated, preserved: floor, floorNum, features, featured, plan  (by unit id)
//   • New units:          created with derived floor/plan + empty features, FLAGGED
//   • Vanished units:     dropped (no longer listed)
//
// It never overwrites hand-written marketing copy, and prints a change report.
// Deterministic: same input → same output, so it's safe to run on a schedule.
//
// Usage:
//   node scripts/refresh-availability.mjs --site magnolia-crestview
//   node scripts/refresh-availability.mjs --site magnolia-crestview --source-file /tmp/listings.json   # offline/test
//   node scripts/refresh-availability.mjs --site magnolia-crestview --dry-run                          # report only, no write

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---- args ----------------------------------------------------------------
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const SITE = getArg('site', process.env.SITE || 'magnolia-crestview');
const sourceFile = getArg('source-file', null);
const dryRun = args.includes('--dry-run');

const siteDir = join(root, 'src/sites', SITE);
const configPath = join(siteDir, 'site.config.json');
const unitsPath = join(siteDir, 'units.json');

const config = JSON.parse(readFileSync(configPath, 'utf8'));
const av = config.availability || {};
const propertyName = av.appfolioProperty;
const sourceUrl = av.source;
if (!propertyName) throw new Error(`[refresh] ${SITE}/site.config.json is missing availability.appfolioProperty`);

// ---- derivations ---------------------------------------------------------
const ORDINALS = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
const floorNumFromId = (id) => {
  const digits = String(id).replace(/\D/g, '');
  return digits ? (parseInt(digits[0], 10) || null) : null;
};
const floorLabelFromId = (id) => {
  const n = floorNumFromId(id);
  if (!n) return '';
  return (ORDINALS[n] || `Floor ${n}`) + ' floor';
};
const normBeds = (b) => (String(b).toLowerCase() === 'studio' ? 0 : Number(b));
const availTypeOf = (s) => (/^now$/i.test(String(s).trim()) ? 'now' : 'soon');
// plan keys are curated + tied to the UI (PLAN_LABELS / floorPlans). Only used
// for brand-new units, which get flagged for human review anyway.
const derivePlan = (beds, baths) => {
  if (beds === 0) return 'studio';
  if (beds === 1) return '1br';
  if (beds === 2 && baths === 2) return '2br2ba';
  return `${beds}br${String(baths).replace(/\.0$/, '')}ba`;
};

// ---- load feed -----------------------------------------------------------
async function loadFeed() {
  if (sourceFile) return JSON.parse(readFileSync(sourceFile, 'utf8'));
  if (!sourceUrl) throw new Error(`[refresh] ${SITE}/site.config.json is missing availability.source (or pass --source-file)`);
  const res = await fetch(sourceUrl, { headers: { 'accept': 'application/json' } });
  if (!res.ok) throw new Error(`[refresh] feed fetch failed: ${res.status} ${res.statusText} for ${sourceUrl}`);
  return res.json();
}

const feed = await loadFeed();
const feedListings = Array.isArray(feed) ? feed : feed.listings || [];
const mine = feedListings.filter((l) => l.property === propertyName);

if (!mine.length) {
  console.error(`[refresh] WARNING: 0 listings for "${propertyName}" in the feed (updatedAt: ${feed.updatedAt || 'n/a'}).`);
  console.error('[refresh] Refusing to wipe units.json on an empty result — check the property name / source. No changes written.');
  console.log('CHANGED=false');
  process.exit(0);
}

// ---- build merged units --------------------------------------------------
const current = JSON.parse(readFileSync(unitsPath, 'utf8'));
const currentUnits = current.units || [];
const byId = new Map(currentUnits.map((u) => [String(u.id), u]));

const skipped = [];
const flagged = [];

const numeric = (id) => {
  const n = parseInt(String(id).replace(/\D/g, ''), 10);
  return Number.isNaN(n) ? Number.POSITIVE_INFINITY : n;
};

const merged = mine
  .filter((l) => {
    const id = String(l.unit ?? '').trim();
    if (!id || /^not specified$/i.test(id)) { skipped.push(l); return false; }
    return true;
  })
  .map((l) => {
    const id = String(l.unit).trim();
    const beds = normBeds(l.bedrooms);
    const baths = Number(l.bathrooms);
    const sqft = Number(l.sqft) || 0;
    const rent = l.rent ? Number(l.rent) : null;
    const available = String(l.available || 'Now');
    const availType = availTypeOf(available);
    const cur = byId.get(id);
    if (cur) {
      // preserve curated fields, refresh AppFolio-driven ones, keep key order stable
      const next = {
        id,
        beds, baths, sqft, rent,
        floor: cur.floor,
        floorNum: cur.floorNum,
        available, availType,
        features: cur.features,
        plan: cur.plan,
      };
      if (cur.featured) next.featured = cur.featured;
      return next;
    }
    // brand-new unit — derive best guesses, flag for review
    flagged.push(id);
    return {
      id,
      beds, baths, sqft, rent,
      floor: floorLabelFromId(id),
      floorNum: floorNumFromId(id),
      available, availType,
      features: [],
      plan: derivePlan(beds, baths),
    };
  })
  .sort((a, b) => numeric(a.id) - numeric(b.id) || String(a.id).localeCompare(String(b.id)));

// ---- change report -------------------------------------------------------
const newById = new Map(merged.map((u) => [u.id, u]));
const added = merged.filter((u) => !byId.has(u.id));
const removed = currentUnits.filter((u) => !newById.has(String(u.id)));
const dataFields = ['beds', 'baths', 'sqft', 'rent', 'available', 'availType'];
const updated = [];
const unchanged = [];
for (const u of merged) {
  const prev = byId.get(u.id);
  if (!prev) continue;
  const diffs = dataFields.filter((f) => (prev[f] ?? null) !== (u[f] ?? null))
    .map((f) => ({ f, from: prev[f] ?? null, to: u[f] ?? null }));
  if (diffs.length) updated.push({ u, diffs }); else unchanged.push(u);
}

const money = (r) => (r == null ? 'Inquire' : `$${Number(r).toLocaleString()}/mo`);
const line = (u) => `  ${propertyName} — Unit ${u.id}: ${money(u.rent)} | ${u.beds === 0 ? 'Studio' : u.beds + ' bd'} / ${u.baths} ba | ${u.sqft.toLocaleString()} sqft | Avail: ${u.available}`;

const R = [];
R.push('============================================================');
R.push(`AVAILABILITY REFRESH — ${propertyName}  (feed updated ${feed.updatedAt || 'n/a'})`);
R.push('============================================================');
R.push(`Active units: ${merged.length} (was ${currentUnits.length})`);
R.push('');
R.push(`NEW UNITS (${added.length})`);
added.forEach((u) => R.push(`${line(u)}   ⚠ review plan/features/floor`));
R.push('');
R.push(`REMOVED UNITS (${removed.length})`);
removed.forEach((u) => R.push(`  ${propertyName} — Unit ${u.id}: was ${money(u.rent)} | ${u.beds} bd / ${u.baths} ba`));
R.push('');
R.push(`UPDATED UNITS (${updated.length})`);
updated.forEach(({ u, diffs }) => {
  R.push(`  ${propertyName} — Unit ${u.id}`);
  diffs.forEach((d) => R.push(`    ${d.f}: ${d.f === 'rent' ? money(d.from) + ' → ' + money(d.to) : d.from + ' → ' + d.to}`));
});
R.push('');
R.push(`UNCHANGED UNITS (${unchanged.length})`);
unchanged.forEach((u) => R.push(line(u)));
if (skipped.length) {
  R.push('');
  R.push(`SKIPPED (no unit number in address) (${skipped.length})`);
  skipped.forEach((l) => R.push(`  ${l.address} — ${l.title}`));
}
R.push('============================================================');
console.log(R.join('\n'));

// ---- write ---------------------------------------------------------------
const nextJson = JSON.stringify({ units: merged }, null, 2) + '\n';
const changed = nextJson !== readFileSync(unitsPath, 'utf8');

if (changed && !dryRun) {
  writeFileSync(unitsPath, nextJson);
  console.error(`\n[refresh] wrote ${unitsPath}`);
} else if (changed) {
  console.error('\n[refresh] changes detected (dry-run: not written)');
} else {
  console.error('\n[refresh] no changes');
}
if (flagged.length) console.error(`[refresh] NEW units need human review: ${flagged.join(', ')}`);
console.log(`CHANGED=${changed}`);
