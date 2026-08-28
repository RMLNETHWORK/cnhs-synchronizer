export type CategoryKey = 'news' | 'events' | 'videos' | 'sports' | 'features' | 'editorial' | 'columns';

// paramName is the query-string key used for that category's article-lookup param, e.g.
// /sports/?sport=<hash>. Only 'news' and 'sport' were given as examples — the rest (event,
// feature, editorial, column, video) are my best-guess singular forms; rename any of them
// here, it's the only place they're defined.
export const CATEGORIES: Record<CategoryKey, { label: string; slug: CategoryKey; blurb: string; paramName: string }> = {
  news: { label: 'News', slug: 'news', blurb: 'What happened on campus, and what it means.', paramName: 'news' },
  events: { label: 'Events', slug: 'events', blurb: 'Upcoming events and happenings.', paramName: 'event' },
  videos: { label: 'Videos', slug: 'videos', blurb: 'Watch our latest videos.', paramName: 'video' },
  sports: { label: 'Sports', slug: 'sports', blurb: 'Every game, every rally, every record.', paramName: 'sport' },
  features: { label: 'Features', slug: 'features', blurb: 'Longer reads on the people and stories behind campus life.', paramName: 'feature' },
  editorial: { label: 'Editorial', slug: 'editorial', blurb: 'Opinion and commentary from The Synchronizer staff.', paramName: 'editorial' },
  columns: { label: 'Columns', slug: 'columns', blurb: 'Recurring takes and running series from our columnists.', paramName: 'column' },
};

export const CATEGORY_ORDER: CategoryKey[] = ['news', 'events', 'videos', 'sports', 'features', 'editorial', 'columns'];