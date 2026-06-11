import { isKeyWithinSite } from '../_shared.js';

export const onRequestGet = async (context) => {
  const key = (context.params.path || []).join('/');
  if (!isKeyWithinSite(key, context.env)) return new Response('Forbidden', { status: 403 });

  const obj = await context.env.DOCUMENTS.get(key);
  if (!obj) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('Content-Length', String(obj.size));

  return new Response(obj.body, { headers });
};
