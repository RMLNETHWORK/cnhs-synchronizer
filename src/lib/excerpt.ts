const MAX_LENGTH = 160;
const TITLE_MAX_LENGTH = 90;
const LEAD_MAX_LENGTH = 160;

export interface HeadlineExcerpts {
  /** Short excerpt for headline slots (Hero slide-title, article h1). */
  title?: string;
  /** Excerpt for a lead/body-preview slot shown alongside the headline slot. Drawn from the
   *  text that comes right after `title`, so it's a distinct stretch rather than a repeat. */
  lead?: string;
}

/**
 * Strips an article's raw Markdown body down to plain, readable text: drops fenced/inline
 * code, images, heading/emphasis/list/blockquote markers, and unwraps links to their text.
 * Not a full Markdown parser — just enough to turn body source into excerpt-safe prose.
 */
export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Drops a body's leading line if it just repeats the title (writers sometimes paste the
 *  headline in as a first line out of habit) — whatever's left is what excerpts are drawn
 *  from. Returns the cleaned plain text, or '' if nothing meaningful remains. */
function bodyWithoutTitleEcho(title: string, body: string): string {
  let plain = stripMarkdown(body);
  const normalizedTitle = title.trim().toLowerCase().replace(/[.!?]+$/, '');
  if (plain.toLowerCase().startsWith(normalizedTitle)) {
    // Slicing only removes the title's own characters — whatever punctuation the writer put
    // right after their pasted-in headline (a colon, a period the title didn't have, a dash)
    // is still sitting at the front of the remainder, so strip that too before trimming.
    plain = plain.slice(normalizedTitle.length).replace(/^[\s:.\-–—!?,]+/, '').trim();
  }
  return plain;
}

/** Clips `text` to at most `maxLength` chars, breaking on a word boundary and adding an
 *  ellipsis, without ever exceeding `maxLength`. Returns the clipped text plus how many
 *  source characters (from `text`) it consumed, so callers can pick up where it left off. */
function clip(text: string, maxLength: number): { result: string; consumed: number } {
  if (text.length <= maxLength) return { result: text, consumed: text.length };

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const breakAt = lastSpace > Math.floor(maxLength / 4) ? lastSpace : maxLength;
  return { result: `${text.slice(0, breakAt).trim()}…`, consumed: breakAt };
}

/**
 * Generates an article's excerpt from its title and body at build time — this is what
 * replaced the old manual `excerpt` frontmatter field. Meant for use alongside a slot that
 * already shows the real title (card grids, related-article lists): the excerpt starts at
 * the beginning of the body and runs up to ~160 characters.
 *
 * Returns undefined when there's no body yet (a title-only stub) — nothing to summarize yet,
 * so no excerpt is generated rather than forcing a placeholder. Callers (cards, meta
 * descriptions) should treat a missing excerpt as "don't render that line" rather than an
 * error.
 */
export function generateExcerpt(title: string, body: string | undefined): string | undefined {
  if (!body || !body.trim()) return undefined;
  const plain = bodyWithoutTitleEcho(title, body);
  if (!plain) return undefined;
  return clip(plain, MAX_LENGTH).result;
}

/**
 * Generates a *pair* of distinct, non-overlapping excerpts for cases where the headline slot
 * itself is filled with generated copy instead of the real title (Hero slide-title, article
 * h1) and a separate lead/body-preview line sits alongside it. `title` is a short excerpt
 * for that headline slot; `lead` picks up in the body wherever `title` left off, so it's a
 * genuinely different stretch of text rather than the same excerpt shown twice.
 *
 * Either field can come back undefined: `title` only if there's no body yet (a title-only
 * stub, nothing to summarize); `lead` also if the remaining body is too short to yield a
 * second, distinct chunk of text.
 */
export function generateHeadlineExcerpts(title: string, body: string | undefined): HeadlineExcerpts {
  if (!body || !body.trim()) return {};
  const plain = bodyWithoutTitleEcho(title, body);
  if (!plain) return {};

  const titleClip = clip(plain, TITLE_MAX_LENGTH);
  const remainder = plain.slice(titleClip.consumed).replace(/^[\s:.\-–—!?,]+/, '').trim();
  const leadExcerpt = remainder ? clip(remainder, LEAD_MAX_LENGTH).result : undefined;

  return { title: titleClip.result, lead: leadExcerpt };
}

/**
 * Plain-text word count for an article body — used to power the "length" sort on /search
 * (longest/shortest read). Reuses the same Markdown-stripping pass as the excerpt generator
 * so headings, image syntax, and link URLs don't inflate the count. Returns 0 for an empty
 * or title-only stub rather than throwing, since search needs a sortable number for every
 * article regardless of how complete it is.
 */
export function getWordCount(body: string | undefined): number {
  if (!body || !body.trim()) return 0;
  const plain = stripMarkdown(body);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}
