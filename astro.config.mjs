import { defineConfig } from 'astro/config';
import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Each Cloudflare Pages project sets SITE=<folder>; locally it defaults to
// magnolia-crestview. Keep this in sync with src/lib/site.ts.
const SITE_ID = process.env.SITE || 'magnolia-crestview';

// Per-site static assets. Anything under src/sites/<id>/public/ (guides,
// llms.txt, property-specific images, etc.) is copied verbatim into the build
// output for the active site — the per-site counterpart to the shared /public
// folder. Runs after Astro has emitted dist/, so these files win on any path
// collision with shared assets.
// Files in a site's public/ folder that reference the site's own absolute URL
// (guide canonicals, og:url, JSON-LD breadcrumbs, llms.txt) write it as the
// token {{SITE_DOMAIN}} rather than a literal host. Astro templates read
// site.config.json directly, but these files are copied byte-for-byte, so
// without substitution they'd keep pointing at whatever host was hardcoded when
// they were written — which silently survives a custom-domain migration and
// leaves wrong canonicals telling Google the old host is authoritative.
const SUBSTITUTABLE = new Set(['.html', '.htm', '.txt', '.xml', '.json', '.css', '.js', '.md']);

function substituteDomain(rootDir, domain) {
  let count = 0;
  for (const entry of readdirSync(rootDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !SUBSTITUTABLE.has(extname(entry.name).toLowerCase())) continue;
    const file = join(entry.parentPath || entry.path || rootDir, entry.name);
    const before = readFileSync(file, 'utf8');
    if (!before.includes('{{SITE_DOMAIN}}')) continue;
    writeFileSync(file, before.replaceAll('{{SITE_DOMAIN}}', domain));
    count++;
  }
  return count;
}

function siteStaticAssets() {
  return {
    name: 'site-static-assets',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const from = fileURLToPath(new URL(`./src/sites/${SITE_ID}/public/`, import.meta.url));
        if (!existsSync(from)) return;
        const out = fileURLToPath(dir);
        cpSync(from, out, { recursive: true });

        const configPath = fileURLToPath(new URL(`./src/sites/${SITE_ID}/site.config.json`, import.meta.url));
        const domain = String(JSON.parse(readFileSync(configPath, 'utf8')).domain || '').replace(/\/$/, '');
        if (!domain) throw new Error(`[site-static-assets] ${SITE_ID}/site.config.json has no "domain" — cannot resolve {{SITE_DOMAIN}}`);
        const n = substituteDomain(out, domain);
        if (n) console.log(`[site-static-assets] resolved {{SITE_DOMAIN}} → ${domain} in ${n} file(s)`);
      },
    },
  };
}

// Static output — deploys to Cloudflare Pages exactly like the original
// single-file site (no server runtime). One Pages project per property,
// each setting SITE=<folder> as a build env var.
export default defineConfig({
  output: 'static',
  build: { format: 'file' },
  integrations: [siteStaticAssets()],
});
