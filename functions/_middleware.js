// Cloudflare Pages Functions middleware.
//
// Sits in front of /dashboard and the document APIs. Cloudflare Access is
// configured in the Cloudflare dashboard to require login before any of these
// routes are reachable. By the time a request gets here, Access has already
// verified the user and injected the Cf-Access-Authenticated-User-Email
// header — we just read it and decide whether the user is "management" (full
// read/write) or "owner" (read-only).
//
// See docs/dashboard-setup.md for the Cloudflare Access policy required to
// make these headers trustworthy. Without that policy these routes return 401.

const PROTECTED_PREFIXES = ['/dashboard', '/api/documents'];

export const onRequest = async (context) => {
  const url = new URL(context.request.url);
  const isProtected = PROTECTED_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(p + '/'));
  if (!isProtected) return context.next();

  const email = context.request.headers.get('Cf-Access-Authenticated-User-Email');
  if (!email) {
    return new Response('Unauthorized — Cloudflare Access required', { status: 401 });
  }

  const managementDomain = (context.env.MANAGEMENT_EMAIL_DOMAIN || 'agmrealestategroup.com').toLowerCase();
  const isManagement = email.toLowerCase().endsWith('@' + managementDomain);

  context.data.accessUser = { email, isManagement };
  return context.next();
};
