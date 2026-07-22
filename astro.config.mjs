import { defineConfig } from 'astro/config';
import { cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Each Cloudflare Pages project sets SITE=<folder>; locally it defaults to
// magnolia-crestview. Keep this in sync with src/lib/site.ts.
const SITE_ID = process.env.SITE || 'magnolia-crestview';

// Per-site static assets. Anything under src/sites/<id>/public/ (guides,
// llms.txt, property-specific images, etc.) is copied verbatim into the build
// output for the active site — the per-site counterpart to the shared /public
// folder. Runs after Astro has emitted dist/, so these files win on any path
// collision with shared assets.
function siteStaticAssets() {
  return {
    name: 'site-static-assets',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const from = fileURLToPath(new URL(`./src/sites/${SITE_ID}/public/`, import.meta.url));
        if (existsSync(from)) cpSync(from, fileURLToPath(dir), { recursive: true });
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
