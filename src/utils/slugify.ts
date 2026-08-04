/**
 * Converts a string into a URL-friendly slug.
 * e.g. "Sony A7 III Mirrorless Camera" -> "sony-a7-iii-mirrorless-camera"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default slugify;

