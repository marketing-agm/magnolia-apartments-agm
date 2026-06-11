import { isKeyWithinSite, json } from './_shared.js';

export const onRequestPost = async (context) => {
  const user = context.data.accessUser;
  if (!user?.isManagement) return json({ error: 'Forbidden — management only' }, { status: 403 });

  let body;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { key } = body || {};
  if (!isKeyWithinSite(key, context.env)) return json({ error: 'Bad key' }, { status: 400 });

  await context.env.DOCUMENTS.delete(key);
  return json({ ok: true });
};
