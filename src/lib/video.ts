export type VideoProvider = 'youtube' | 'vimeo' | 'facebook' | 'file' | 'unknown';

export interface VideoInfo {
  provider: VideoProvider;
  /** URL to drop into an <iframe> (or a <video> src, for provider 'file') */
  embedUrl: string;
  /** Only populated for providers where a thumbnail can be derived without an API call */
  thumbnailUrl?: string;
}

const localVideoModules = import.meta.glob<string>(
  '/src/content/*/*/videos/*.{mp4,webm,ogv,ogg,mov}',
  { eager: true, query: '?url', import: 'default' }
);

/**
 * Mirrors Astro's default content-collection id generation for glob-loaded entries:
 * folder names are lowercased and non-alphanumeric runs collapse to a single hyphen.
 * A folder literally named "the final page" gets the id "the-final-page" — this needs
 * to match that exactly, or a lookup by `entry.id` will never find its own subfolder.
 */
function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sortedVideoPaths(category: string, slug: string): string[] {
  const categoryPrefix = `/src/content/${category}/`;
  return Object.keys(localVideoModules)
    .filter((path) => {
      if (!path.startsWith(categoryPrefix)) return false;
      const folderName = path.slice(categoryPrefix.length).split('/')[0];
      return slugify(folderName) === slug;
    })
    .sort((a, b) => a.localeCompare(b));
}

/**
 * The article's own uploaded video file, if its /videos subfolder has one.
 * Like /gallery, no frontmatter field is needed — just drop the file in the folder.
 * If more than one file is present, the alphabetically-first one is used.
 */
export function getLocalVideoUrl(category: string, slug: string): string | undefined {
  const first = sortedVideoPaths(category, slug)[0];
  return first ? localVideoModules[first] : undefined;
}

/**
 * Parses a raw video URL (as pasted from a browser address bar) into something embeddable.
 * Supports YouTube (incl. youtu.be / shorts), Vimeo, Facebook video, and direct file links
 * (.mp4/.webm/.ogg). Returns null if the string isn't a usable URL at all.
 */
export function getVideoInfo(url?: string): VideoInfo | null {
  if (!url) return null;

  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');

  // YouTube
  if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'youtu.be') {
    let id = '';
    if (host === 'youtu.be') {
      id = u.pathname.slice(1);
    } else if (u.pathname.startsWith('/embed/')) {
      id = u.pathname.replace('/embed/', '');
    } else if (u.pathname.startsWith('/shorts/')) {
      id = u.pathname.replace('/shorts/', '');
    } else {
      id = u.searchParams.get('v') || '';
    }
    id = id.split('/')[0].split('?')[0];
    if (!id) return null;
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  // Vimeo
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = u.pathname.split('/').filter(Boolean).pop();
    if (!id) return null;
    return {
      provider: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${id}`,
    };
  }

  // Facebook (facebook.com/.../videos/..., facebook.com/watch/?v=..., fb.watch/...)
  if (host === 'facebook.com' || host === 'fb.watch') {
    return {
      provider: 'facebook',
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`,
    };
  }

  // Direct file link
  if (/\.(mp4|webm|ogv|ogg)$/i.test(u.pathname)) {
    return { provider: 'file', embedUrl: url };
  }

  return { provider: 'unknown', embedUrl: url };
}

/**
 * Resolves the video to actually show for an article. A file in the article's own
 * /videos subfolder always takes priority (no frontmatter needed); if there isn't one,
 * falls back to parsing the external videoUrl frontmatter field. Returns null if the
 * article has neither.
 */
export function getArticleVideo(category: string, slug: string, videoUrlFrontmatter?: string): VideoInfo | null {
  const localUrl = getLocalVideoUrl(category, slug);
  if (localUrl) {
    return { provider: 'file', embedUrl: localUrl };
  }
  return getVideoInfo(videoUrlFrontmatter);
}