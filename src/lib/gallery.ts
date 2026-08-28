import type { ImageMetadata } from 'astro';

const galleryModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/content/*/*/gallery/*.{jpg,jpeg,png,webp,avif}',
  { eager: true }
);

const captionModules = import.meta.glob<{ default: Record<string, string> }>(
  '/src/content/*/*/gallery/captions.json',
  { eager: true }
);

export interface GalleryImage {
  src: ImageMetadata;
  alt: string;
  caption?: string;
}

function deriveAlt(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/^\d+[-_.]?\s*/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
}

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

function articleFolderPath(category: string, slug: string, subfolder: string): string | undefined {
  const categoryPrefix = `/src/content/${category}/`;
  const match = Object.keys(galleryModules).find((path) => {
    if (!path.startsWith(categoryPrefix)) return false;
    const folderName = path.slice(categoryPrefix.length).split('/')[0];
    return slugify(folderName) === slug;
  });
  if (!match) return undefined;
  const folderName = match.slice(categoryPrefix.length).split('/')[0];
  return `${categoryPrefix}${folderName}/${subfolder}/`;
}

function sortedGalleryPaths(category: string, slug: string): string[] {
  const prefix = articleFolderPath(category, slug, 'gallery');
  if (!prefix) return [];
  return Object.keys(galleryModules)
    .filter((path) => path.startsWith(prefix))
    .sort((a, b) => a.localeCompare(b));
}

/** Full ordered list of an article's gallery images, captions attached if a captions.json sidecar exists. */
export function getGalleryImages(category: string, slug: string): GalleryImage[] {
  const prefix = articleFolderPath(category, slug, 'gallery');
  const captionsMap = (prefix && captionModules[`${prefix}captions.json`]?.default) || {};
  return sortedGalleryPaths(category, slug).map((path) => {
    const filename = path.split('/').pop() || '';
    return { src: galleryModules[path].default, alt: deriveAlt(filename), caption: captionsMap[filename] || '' };
  });
}

/** The alphabetically-first gallery image, if the article has a gallery folder at all. */
export function getFirstGalleryImage(category: string, slug: string): ImageMetadata | undefined {
  const first = sortedGalleryPaths(category, slug)[0];
  return first ? galleryModules[first].default : undefined;
}

/**
 * The image a card/thumbnail should show for an article: the first gallery photo if one exists
 * (so cards stay visually distinct from each other even when articles share the same pubmat),
 * otherwise the frontmatter cover image, otherwise undefined (falls back to the gradient placeholder).
 */
export function getCardImage(category: string, slug: string, frontmatterImage?: ImageMetadata): ImageMetadata | undefined {
  return getFirstGalleryImage(category, slug) || frontmatterImage;
}