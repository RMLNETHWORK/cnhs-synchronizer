// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // Replace with the real production domain — used to build absolute canonical/OG URLs.
  // Taken from the example URLs given (synchronizer.com) as a placeholder.
  site: 'https://synchronizer.com',
  // Every page is rendered on request (a Cloudflare Worker), not pre-built as static files.
  // This is what lets /sports/?sport=<hash> resolve to genuinely different, fully-formed
  // HTML — including per-article <title>/meta tags — for each hash, which a purely static
  // build can't do (a static host serves the same file regardless of query string).
  //
  // Deliberately NOT using output: 'hybrid' with export const prerender = true on the mostly-
  // static pages (home, category listings without a hash) to keep everything on one rendering
  // path — as of this Astro/adapter version there are open upstream issues where mixing
  // prerendered pages with on-demand ones under the Cloudflare adapter causes routing
  // mismatches in production. Full 'server' output avoids that mixed-mode bug class entirely.
  // Revisit hybrid once those are resolved upstream, if build cost becomes worth optimizing.
  output: 'server',
  adapter: cloudflare(),
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});