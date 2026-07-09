// Build-time token substitution for the shared body markup.
// Tokens look like {{name}} or {{contact.phoneDisplay}} — a dotted path into
// the site config. Resolved in index.astro before the HTML is injected, so the
// shipped page is fully rendered (no client-side flash, no SEO regression).

export function resolvePath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => {
    if (o == null) return undefined;
    return (o as Record<string, unknown>)[k];
  }, obj);
}

export function applyTokens(html: string, ctx: unknown): string {
  return html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (whole, path: string) => {
    const value = resolvePath(ctx, path);
    if (value == null) {
      // Leave the token visible so a missing field is caught in review/build,
      // rather than silently rendering an empty string.
      console.warn(`[template] unresolved token ${whole}`);
      return whole;
    }
    return String(value);
  });
}
