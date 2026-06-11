import { isValidFolder, siteSlug, json } from './_shared.js';

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB per file

export const onRequestPost = async (context) => {
  const user = context.data.accessUser;
  if (!user?.isManagement) return json({ error: 'Forbidden — management only' }, { status: 403 });

  const form = await context.request.formData();
  const folder = form.get('folder');
  const file = form.get('file');

  if (!isValidFolder(folder)) return json({ error: 'Unknown folder' }, { status: 400 });
  if (!(file instanceof File)) return json({ error: 'Missing file' }, { status: 400 });
  if (file.size > MAX_BYTES) return json({ error: 'File too large (50 MB max)' }, { status: 413 });

  // Sanitize the filename so it can't contain path separators or odd control
  // characters — we only let alphanumerics, dots, dashes, underscores, spaces.
  const safeName = (file.name || 'document').replace(/[^\w.\- ]+/g, '_').slice(0, 200);
  const key = `${siteSlug(context.env)}/${folder}/${safeName}`;

  await context.env.DOCUMENTS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
    customMetadata: { uploadedBy: user.email, uploadedAt: new Date().toISOString() },
  });

  return json({ ok: true, key, name: safeName });
};
