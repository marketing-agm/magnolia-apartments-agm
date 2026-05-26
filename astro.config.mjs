import { defineConfig } from 'astro/config';

// Static output — deploys to Cloudflare Pages exactly like the original
// single-file site (no server runtime). One Pages project per property,
// each setting SITE=<folder> as a build env var.
export default defineConfig({
  output: 'static',
  build: { format: 'file' },
});
