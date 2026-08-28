/**
 * Deterministic, short opaque id for an article — this is what shows up as the value of the
 * `?<category>=` query param instead of the readable folder/slug name (e.g. `f3a9c2d1` instead
 * of `palarong-bicol`). Derived from category + slug so it's stable across builds without
 * needing to store a new field in frontmatter, and distinct across categories even if two
 * categories happened to reuse the same slug.
 *
 * This is FNV-1a, not a cryptographic hash — there's no secrecy requirement here (the mapping
 * necessarily has to be computable from public content anyway), just a short, stable, evenly
 * distributed id. Plain JS with no Node built-ins, so it runs identically at build time and in
 * the Cloudflare Worker at request time.
 */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** The opaque id for a given category+slug — used to build `?<param>=<hash>` links. */
export function hashArticleId(category: string, slug: string): string {
  return fnv1a(`${category}/${slug}`).toString(16).padStart(8, '0');
}
