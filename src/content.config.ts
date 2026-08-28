import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import type { ZodType } from 'astro:schema';

const articleSchema = ({ image }: { image: () => ZodType<any> }) =>
  z.object({
    title: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    classImage: image().optional(),
    classImageAlt: z.string().optional(),
    videoUrl: z.string().url().optional(),
    draft: z.boolean().default(false),
  });

const news = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/news' }),
  schema: articleSchema,
});

const events = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/events' }),
  schema: articleSchema,
});

const videos = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/videos' }),
  schema: articleSchema,
});

const sports = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/sports' }),
  schema: articleSchema,
});

const features = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/features' }),
  schema: articleSchema,
});

const editorial = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/editorial' }),
  schema: articleSchema,
});

const columns = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/columns' }),
  schema: articleSchema,
});

export const collections = { news, events, videos, sports, features, editorial, columns };