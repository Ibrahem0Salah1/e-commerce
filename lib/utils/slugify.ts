// lib/utils/slugify.ts
// Fixed version for Next.js / browser compatibility

export function slugify(input: string): string {
  if (!input) return "";

  return input
    .toString() // ensure string
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // replace any non-alphanumeric chars with hyphen
    .replace(/^-+|-+$/g, ""); // trim hyphens from start/end
}
