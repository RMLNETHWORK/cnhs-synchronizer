/**
 * Article view counts, used to power the "popularity" sort on /search.
 *
 * This site has no analytics backend, so "popular" has to mean something real: a count of
 * article-page loads, persisted in a Cloudflare KV namespace bound as `VIEWS`. Every function
 * here is defensive about that binding being missing — during local `astro dev` without a
 * configured namespace, or before it's been set up in the Cloudflare Pages dashboard, view
 * tracking silently no-ops and popularity sort falls back to 0 for everything (see the `sort`
 * option in src/pages/search/index.astro, which then breaks ties by recency). Nothing here
 * should ever be able to break a page render — a KV outage degrades a sort order, not the site.
 *
 * Setup required for this to actually count anything in production: see the "Popularity
 * tracking (KV setup)" section added to README.md.
 */

// Minimal structural type for the one KV surface used here — avoids pulling in
// @cloudflare/workers-types as a dependency just for this.
export interface ViewsKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
}

const PREFIX = 'views:';

function keyFor(category: string, slug: string): string {
  return `${PREFIX}${category}/${slug}`;
}

/**
 * Increments the view count for one article by 1. Fire-and-forget from the article view —
 * callers should pass this to `runtime.ctx.waitUntil()` so it never delays the response.
 * Read-modify-write on a single per-article key, so concurrent hits on the *same* article
 * within the same instant could occasionally undercount by one — an acceptable tradeoff for a
 * school publication's traffic in exchange for not needing Durable Objects for a "sort order"
 * feature. Swallows all errors: a failed write should never surface to the reader.
 */
export async function recordView(kv: ViewsKV | undefined, category: string, slug: string): Promise<void> {
  if (!kv) return;
  try {
    const key = keyFor(category, slug);
    const current = parseInt((await kv.get(key)) || '0', 10) || 0;
    await kv.put(key, String(current + 1));
  } catch {
    // View tracking is a nice-to-have for sort order, never worth failing a request over.
  }
}

/** category/slug -> view count, for every article that has been viewed at least once. */
export type ViewCounts = Record<string, number>;

/**
 * Reads every stored view count in one pass — used once per /search render to sort by
 * popularity. Returns an empty map (never throws) if the KV binding isn't configured, so the
 * page still renders and just treats every article as equally (un)popular.
 */
export async function getViewCounts(kv: ViewsKV | undefined): Promise<ViewCounts> {
  const counts: ViewCounts = {};
  if (!kv) return counts;
  try {
    const { keys } = await kv.list({ prefix: PREFIX });
    await Promise.all(
      keys.map(async ({ name }) => {
        const raw = await kv.get(name);
        counts[name.slice(PREFIX.length)] = parseInt(raw || '0', 10) || 0;
      })
    );
  } catch {
    // Fall through with whatever was collected — a partial/empty map is a safe default.
  }
  return counts;
}

/** Looks up one article's count out of a map returned by `getViewCounts`. */
export function getViewCount(counts: ViewCounts, category: string, slug: string): number {
  return counts[`${category}/${slug}`] || 0;
}
