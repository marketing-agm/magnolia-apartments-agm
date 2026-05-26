import type { APIRoute } from 'astro';
import { getSite } from '../lib/site';

export const GET: APIRoute = () => {
  const { config } = getSite();
  const base = config.domain.replace(/\/$/, '');
  const body = `# ${config.name} — allow all crawlers\nUser-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
