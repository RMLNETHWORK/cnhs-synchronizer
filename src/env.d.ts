/// <reference types="astro/client" />

// Astro 6 + @astrojs/cloudflare v13+ removed Astro.locals.runtime entirely: bindings now come
// from `import { env } from 'cloudflare:workers'`, and the execution context (for
// `waitUntil`) is `Astro.locals.cfContext`. See src/lib/views.ts for the one binding this
// project uses (VIEWS, for the /search popularity sort).
//
// 'cloudflare:workers' isn't a real npm package — it's a virtual module the Cloudflare
// runtime provides — so TypeScript has no types for it out of the box. This is deliberately a
// minimal hand-rolled declaration (just the `env` export, typed as an unknown-shaped record
// that call sites narrow themselves) rather than pulling in @cloudflare/workers-types or
// running `wrangler types` for a single optional binding. Worth switching to the generated
// types if more bindings get added later.
declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
}

declare namespace App {
  interface Locals {
    /** Execution context, e.g. `Astro.locals.cfContext.waitUntil(promise)` — used in
     *  ArticleView.astro so the view-count KV write never delays the response. Optional
     *  because it isn't present outside a real Cloudflare request (falls back to a plain
     *  awaited/caught promise at each call site instead). */
    cfContext?: {
      waitUntil(promise: Promise<unknown>): void;
    };
  }
}
