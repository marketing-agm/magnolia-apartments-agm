// Regenerate the per-site `files:` entries in public/admin/config.yml from the
// folders in src/sites/*, so every property shows up in the /admin editor.
//
//   node scripts/gen-cms-config.mjs
//
// The field SCHEMA lives on the first (template) entry of each collection. This
// script clones that entry for each site, swapping only name/label/file. It only
// rewrites the region between the `# gen-cms:start <tag>` / `# gen-cms:end <tag>`
// markers — comments and field schemas are preserved. No YAML dependency.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfgPath = join(root, 'public', 'admin', 'config.yml');
const sitesDir = join(root, 'src', 'sites');

const TAGS = ['property', 'units', 'photos', 'neighborhood'];

const sites = readdirSync(sitesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(sitesDir, d.name, 'site.config.json')))
  .map((d) => d.name)
  .sort();

if (!sites.length) { console.error('No sites found in src/sites/*'); process.exit(1); }

const labelOf = {};
for (const id of sites) {
  try { labelOf[id] = JSON.parse(readFileSync(join(sitesDir, id, 'site.config.json'), 'utf8')).name || id; }
  catch { labelOf[id] = id; }
}

const lines = readFileSync(cfgPath, 'utf8').split('\n');

function regen(tag) {
  const start = lines.findIndex((l) => new RegExp(`^\\s*# gen-cms:start ${tag}\\s*$`).test(l));
  const end = lines.findIndex((l) => new RegExp(`^\\s*# gen-cms:end ${tag}\\s*$`).test(l));
  if (start === -1 || end === -1 || end <= start) throw new Error(`markers for "${tag}" not found`);

  // Split the marked region into entries at 6-space "- name:" headers.
  const inner = lines.slice(start + 1, end);
  const entries = [];
  let cur = null;
  for (const l of inner) {
    if (/^      - name: /.test(l)) { if (cur) entries.push(cur); cur = [l]; }
    else if (cur) cur.push(l);
  }
  if (cur) entries.push(cur);
  if (!entries.length) throw new Error(`no template entry between "${tag}" markers`);

  const template = entries[0].join('\n');
  const fileM = template.match(/^        file: .*\/([^/\n]+)\s*$/m);
  if (!fileM) throw new Error(`no "file:" line in "${tag}" template entry`);
  const basename = fileM[1];

  const rebuilt = sites.map((id) => template
    .replace(/^      - name: .*$/m, () => `      - name: ${id}`)
    .replace(/^        label: .*$/m, () => `        label: ${labelOf[id]}`)
    .replace(/^        file: .*$/m, () => `        file: src/sites/${id}/${basename}`)
  ).join('\n').split('\n');

  lines.splice(start + 1, end - start - 1, ...rebuilt);
}

for (const tag of TAGS) regen(tag);

writeFileSync(cfgPath, lines.join('\n'));
console.log(`✓ Regenerated CMS config for ${sites.length} site(s): ${sites.join(', ')}`);
