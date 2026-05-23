// One-shot migration: slice the proven single-file index.html into reusable
// template parts (CSS, body markup, app JS) and extract per-site data to JSON.
// Lossless by design — CSS / body / JS are copied verbatim; only the data
// array literals are lifted out and replaced with reads from window.__SITE__.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'index.html'), 'utf8');
const lines = src.split('\n');

// 1-indexed, inclusive slice helper
const slice = (from, to) => lines.slice(from - 1, to).join('\n');

const marker = (re, label) => {
  const i = lines.findIndex((l) => re.test(l));
  if (i === -1) throw new Error(`could not locate ${label}`);
  return i + 1; // 1-indexed
};

const styleOpen = marker(/^<style>/, '<style>');
const styleClose = marker(/^<\/style>/, '</style>');
const bodyOpen = marker(/^<body>/, '<body>');
const leaflet = marker(/leaflet\.min\.js/, 'leaflet script');
const appOpen = leaflet + 1; // the <script> right after leaflet
const appClose = lines.findIndex((l, i) => i + 1 > appOpen && /^<\/script>/.test(l)) + 1;

const css = slice(styleOpen + 1, styleClose - 1);
const body = slice(bodyOpen + 1, leaflet - 1);
let app = slice(appOpen + 1, appClose - 1);

// --- extract array literals with a string/comment-aware bracket scanner ---
function extractArray(text, name) {
  const decl = new RegExp(`const\\s+${name}\\s*=\\s*\\[`);
  const m = decl.exec(text);
  if (!m) throw new Error(`array ${name} not found`);
  const arrStart = m.index + m[0].length - 1; // position of '['
  let i = arrStart, depth = 0, str = null, line = false, block = false;
  for (; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (line) { if (c === '\n') line = false; continue; }
    if (block) { if (c === '*' && n === '/') { block = false; i++; } continue; }
    if (str) { if (c === '\\') { i++; continue; } if (c === str) str = null; continue; }
    if (c === '/' && n === '/') { line = true; i++; continue; }
    if (c === '/' && n === '*') { block = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { str = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { i++; break; } }
  }
  const literal = text.slice(arrStart, i);
  // eat trailing semicolon for clean replacement
  let end = i;
  while (end < text.length && /\s/.test(text[end])) end++;
  if (text[end] === ';') end++;
  const value = new Function(`return (${literal});`)();
  return { value, declStart: m.index, declEnd: end };
}

const data = {};
for (const [name, key] of [
  ['UNITS', 'units'],
  ['PLACES', 'places'],
  ['PHOTOS', 'photos'],
  ['BUS_STOPS', 'busStops'],
]) {
  const { value, declStart, declEnd } = extractArray(app, name);
  data[key] = value;
  app =
    app.slice(0, declStart) +
    `const ${name} = (window.__SITE__ && window.__SITE__.data.${key}) || [];` +
    app.slice(declEnd);
  console.log(`extracted ${name}: ${value.length} items`);
}

// per-site secret: read the ORS routing key from injected config instead of inline
const orsBefore = app;
app = app.replace(
  /const\s+ORS_API_KEY\s*=\s*'[^']*'\s*;/,
  "const ORS_API_KEY = (window.__SITE__ && window.__SITE__.config.integrations.orsApiKey) || '';"
);
console.log(orsBefore === app ? 'WARNING: ORS_API_KEY not rewritten' : 'rewired ORS_API_KEY');

const site = join(root, 'src/sites/magnolia-crestview');
writeFileSync(join(site, 'units.json'), JSON.stringify(data.units, null, 2));
writeFileSync(join(site, 'places.json'), JSON.stringify(data.places, null, 2));
writeFileSync(join(site, 'photos.json'), JSON.stringify(data.photos, null, 2));
writeFileSync(join(site, 'bus-stops.json'), JSON.stringify(data.busStops, null, 2));
writeFileSync(join(root, 'src/styles/global.css'), css);
writeFileSync(join(root, 'src/generated/body.html'), body);
writeFileSync(join(root, 'public/app.js'), app);

console.log('\nwrote: units/places/photos/bus-stops.json, global.css, body.html, app.js');
console.log(`css ${css.length}b · body ${body.length}b · app ${app.length}b`);
