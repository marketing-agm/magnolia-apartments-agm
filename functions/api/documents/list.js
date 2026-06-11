import { isValidFolder, siteSlug, json } from './_shared.js';

export const onRequestGet = async (context) => {
  const folder = new URL(context.request.url).searchParams.get('folder');
  if (!isValidFolder(folder)) return json({ error: 'Unknown folder' }, { status: 400 });

  const prefix = `${siteSlug(context.env)}/${folder}/`;
  const list = await context.env.DOCUMENTS.list({ prefix });
  const files = list.objects.map((obj) => ({
    key: obj.key,
    name: obj.key.slice(prefix.length),
    size: obj.size,
    uploaded: obj.uploaded,
    uploadedBy: obj.customMetadata?.uploadedBy || null,
  }));
  files.sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());
  return json({ folder, files });
};
