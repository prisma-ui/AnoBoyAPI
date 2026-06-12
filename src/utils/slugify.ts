export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function extractSlugFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.replace(/^\/|\/$/g, '').split('/');
    // For anime URLs: /anime/{slug}/
    // For episode URLs: /{slug}/
    if (parts[0] === 'anime' && parts.length >= 2) {
      return parts[1];
    }
    return parts[parts.length - 1] || parts[0];
  } catch {
    const clean = url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/|\/$/g, '');
    const parts = clean.split('/');
    if (parts[0] === 'anime' && parts.length >= 2) return parts[1];
    return parts[parts.length - 1] || parts[0];
  }
}

export function extractEpisodeIdFromArticle(id: string): string {
  return id.replace('post-', '');
}

export function decodeBase64(encoded: string): string {
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

export function normalizeFilterSlug(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-');
}
