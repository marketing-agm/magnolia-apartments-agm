// Shared helpers for the document APIs.

export const FOLDERS = {
  'reports': 'Reports',
  'marketing-and-leasing': 'Marketing and Leasing',
  'marketing-comparatives': 'Marketing Comparatives',
};

export function siteSlug(env) {
  return env.SITE_SLUG || 'magnolia-crestview';
}

export function isValidFolder(folder) {
  return typeof folder === 'string' && Object.prototype.hasOwnProperty.call(FOLDERS, folder);
}

// Every R2 key for this site starts with `${siteSlug}/`. The download/delete
// endpoints accept a key from the client, so we reject anything outside the
// site prefix — otherwise one property's signed-in user could read or delete
// another property's documents.
export function isKeyWithinSite(key, env) {
  if (typeof key !== 'string' || !key.length) return false;
  return key.startsWith(siteSlug(env) + '/');
}

export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', ...(init.headers || {}) },
  });
}
