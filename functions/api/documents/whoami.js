import { json } from './_shared.js';

export const onRequestGet = async (context) => {
  const user = context.data.accessUser;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
  return json({ email: user.email, isManagement: user.isManagement });
};
