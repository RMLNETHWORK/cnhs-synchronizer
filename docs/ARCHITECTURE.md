# Architecture Tutorial

This explains every file in the project, how they connect, and how to make common changes. Read top to bottom for the full picture, or jump to "Quick reference" at the end.

---

## 1. The mental model

Astro builds a **static site**: at build time (`npm run build`), it reads your Markdown content and `.astro` templates, and outputs plain `.html`, `.css`, `.js` files into `dist/`. Nothing runs on a server afterward — Cloudflare Pages just serves those files as-is.

Three things drive what gets built:

1. **Content** — the Markdown articles in `src/content/`
2. **Schema** — the rules in `content.config.ts` that validate that content
3. **Pages** — the `.astro` files in `src/pages/` that decide what URLs exist and what each URL renders

Everything else (`layouts/`, `components/`, `styles/`, `lib/`) is support machinery that pages and other components reuse.

---

## 2. Content layer

### `src/content.config.ts`

The rulebook for your articles. Defines six **collections** — `news`, `events`, `sports`, `features`, `editorial`, `videos` — and for each one:

- `loader: glob(...)` — tells Astro *where* to find that category's articles (every `index.md` under `src/content/news/`, etc.)
- `schema: articleSchema` — tells Astro *what fields* every article must have, and their types:

| Field | Type | Required? |
|---|---|---|
| `title` | string | yes |
| `date` | date | yes |
| `author` | string | yes |
| `classImage` | image file | no |
| `classImageAlt` | string | no |
| `videoUrl` | string (URL) | no |
| `draft` | boolean | no (defaults to `false`) |

If an article's frontmatter is missing a required field, or has the wrong type, **the build fails with an error** instead of silently shipping a broken page. This is your safety net when you're manually copying in writer submissions.

There's no `excerpt` field — it's generated automatically from `title` and the body at build time by `src/lib/excerpt.ts`, so it isn't part of what a writer fills in. See that file's section below for how.

The `classImage` field specifically uses Astro's `image()` helper (not a plain string) — that's what makes cover photos get validated as real files, bundled, and automatically compressed to WebP at build time.

### `src/content/<category>/<slug>/index.md`

One folder per article. Example: `src/content/news/ordinance/index.md`. Anatomy:

```markdown
---
title: "Barangay Council Passes Curfew Ordinance for Minors"
date: 2026-07-18
author: "Kristine Abundo"
classImage: "pubmat.jpg"
classImageAlt: "News Update pubmat"
draft: false
---

Article body in Markdown. Can include more images:
![Caption](another-photo.jpg)
```

The stuff between `---` is **frontmatter** — structured metadata `content.config.ts` validates. Everything below the second `---` is the **body** — rendered as the article's actual content.

Images referenced in frontmatter or inline in the body must be actual files sitting in that same folder.

### `src/lib/categories.ts`

The single source of truth for category metadata — the 6 keys, their display labels ("News" vs the internal key `news`), URL slugs, and one-line blurbs. Every page/component that needs "what are the categories and what do they look like" imports from here instead of hardcoding the list repeatedly. Change a label once, it updates on the nav, footer, homepage, and category pages simultaneously.

### `src/lib/gallery.ts`

Shared logic for an article's `gallery/` folder, used by every page that needs it instead of each duplicating its own `import.meta.glob()` call:

- `getGalleryImages(category, slug)` — the full ordered list of an article's gallery photos, with alt text and captions attached. Used by `Gallery.astro`.
- `getFirstGalleryImage(category, slug)` — just the alphabetically-first photo.
- `getCardImage(category, slug, frontmatterImage?)` — the image priority logic for card thumbnails specifically: first gallery photo if one exists, otherwise the article's `classImage`, otherwise `undefined` (renders the gradient placeholder). This is what keeps cards visually distinct even when several articles share the same branded pubmat graphic as their `classImage` — see the table in the README's "Which image shows where" section for the full picture of what shows where.

### `src/lib/excerpt.ts`

Generates the lead excerpt shown on cards and used as the meta description — there's no manual `excerpt` frontmatter field to fill in.

- `generateExcerpt(title, body)` — strips the article's raw Markdown body down to plain text (drops code fences, images, heading/list/emphasis markers, unwraps links to their text), skips a leading line that just repeats the title verbatim, then returns either the full plain-text body (if it's short) or a clean truncation to ~160 characters cut at a word boundary with a trailing `…`. Returns `undefined` if the article has no body yet (a title-only stub) — every call site treats a missing excerpt as "render nothing there," not an error.
- Called per-article at the page level (`[category]/index.astro`, `[category]/[slug].astro`, `CategorySection.astro`) rather than baked into the content schema, since it needs the entry's raw `body`, which `content.config.ts` schemas don't have access to.

---

## 3. Routing layer — `src/pages/`

Astro turns file paths into URL paths. A `[bracketed]` segment means "this part of the URL is a variable, generate one page per value I return."

### `src/pages/index.astro` → `/`

The homepage. What it does, in order:
1. Fetches all 4 collections via `getCollection()`
2. Sorts each by date, newest first
3. Finds the single newest article across *all* categories → passes it to `<Hero>`
4. Renders one `<CategorySection>` per category below the hero

### `src/pages/[category]/index.astro` → `/news`, `/events`, `/videos`, `/sports`

**One file, four pages.** `getStaticPaths()` returns:
```js
[{ params: { category: 'news' } }, { params: { category: 'events' } }, ...]
```
For each, the page fetches that category's full article list and renders it as a grid of `<ArticleCard>`s. This is the "browse everything in this section" page.

### `src/pages/[category]/[slug].astro` → `/news/ordinance`, `/sports/chess-club`, etc.

**One file, 24 pages** (one per article that exists right now, more as you add articles). `getStaticPaths()` loops every category, then every article inside it, returning one path per article with the article's data pre-attached as `props`.

This page renders **one specific article in full**:
- Back link + category label + headline + byline/date, with the frontmatter `classImage` (if set) displayed beside the headline in a two-column layout — single column if there's no image
- The article body (rendered from Markdown via `<Content />`)
- An optional photo gallery (see `Gallery.astro` below)
- Up to 3 related articles from the same category at the bottom (uses `<ArticleCard>` again, in `compact` size)

**Key distinction, since this tripped up earlier questions:** `[category]/index.astro` is the *listing* (many articles, no full content). `[category]/[slug].astro` is the *individual page* (one article, full content). Neither of these defines what a *card* looks like — that's next.

---

## 4. Reusable components — `src/components/`

These don't correspond to URLs directly — they're building blocks that pages assemble.

### `ArticleCard.astro`

The preview card — title, generated excerpt, thumbnail, author/date — used in **three different places**: homepage sections, category listing grids, and the "More in [category]" strip on article pages. Edit this file once, every card everywhere updates. Its `excerpt` prop is optional — it renders nothing for that line when `generateExcerpt()` returns `undefined`.

Has two visual sizes: `default` (category listing pages) and `compact` (homepage, related articles) — controlled by a `size` prop, styled via `.card` vs `.card.compact` in the file's `<style>` block.

The `image` it receives isn't necessarily the article's `classImage` — see `lib/gallery.ts` below. Falls back to a gradient placeholder with a `§` glyph when nothing's available.

### `CategorySection.astro`

Used only by the homepage. Renders one category's heading + blurb + up to 5 `ArticleCard`s + a "See more" link. The 5-article cap is just `articles.slice(0, 5)` — change that number to show more or fewer on the homepage.

### `Gallery.astro`

Renders an optional "In Photos" section on an article page, fed by `getGalleryImages()` from `lib/gallery.ts` (see below). If the images array is empty, the component renders nothing. Includes a click-to-enlarge lightbox with keyboard support (arrow keys, Escape) and per-photo captions, built with a small inline `<script>`.

### `Hero.astro`

The big featured block at the top of the homepage. Shows either the animated feather SVG (brand signature, default) or the featured article's frontmatter cover image if it has one.

### `Nav.astro`

The sticky top bar: logo, masthead text, category links, theme toggle, mobile hamburger. Contains actual client-side JavaScript (in a `<script>` tag) for the toggle and mobile menu — this is the one place where real browser JS ships, since Astro components are static HTML by default otherwise.

### `Footer.astro`

Logo, tagline, category links again, and your social handles (Facebook, Instagram, TikTok, X, email).

---

## 5. Layout — `src/layouts/BaseLayout.astro`

Every page (`index.astro`, `[category]/index.astro`, `[category]/[slug].astro`) wraps its content in this. It provides:
- The `<head>` — meta tags, page `<title>`, favicon
- An inline script that reads your saved theme preference from `localStorage` and applies it *before* the page paints — this is what prevents a white flash when you load a page in dark mode
- `<Nav />` and `<Footer />` around whatever the page puts inside `<slot />`

---

## 6. Styling — `src/styles/global.css`

Design tokens as CSS custom properties, not hardcoded values scattered through components:

- **Color** — `--bg`, `--ink`, `--brand-1`/`--brand-2`, etc. The `:root[data-theme='dark']` block overrides these when dark mode is on. Components reference the variables, never raw colors — that's what makes the whole site re-theme instantly on toggle.
- **Type** — `--font-display` (Caros, your uploaded font), `--font-body` (Source Serif 4, for article reading), `--font-mono` (JetBrains Mono, for labels/dates)
- **`@font-face` rules** — the actual Caros font-loading declarations, pointing at the WOFF2 files in `public/fonts/`

---

## 7. Static assets — `public/`

Anything in here is copied to the output root untouched, no processing:
- `public/images/` — your logo mark and masthead card
- `public/fonts/` — the converted Caros WOFF2 files

This is different from images inside `src/content/<article>/` — those go through Astro's image pipeline (resizing, WebP conversion) because they're referenced through the `image()` schema helper, not just dropped in `public/`.

---

## 8. Config

- **`astro.config.mjs`** — Astro's own settings (currently minimal, no extra integrations configured)
- **`package.json`** — dependencies and the `dev`/`build`/`preview` scripts you already use

---

## Quick reference — "I want to change X"

| I want to... | Edit this file |
|---|---|
| Add/edit an article | `src/content/<category>/<slug>/index.md` |
| Change what fields articles can have | `src/content.config.ts` |
| Rename a category label | `src/lib/categories.ts` |
| Change how a card looks (any card, anywhere) | `src/components/ArticleCard.astro` |
| Change which image a card shows (gallery-first vs. frontmatter priority) | `src/lib/gallery.ts` (`getCardImage`) |
| Change how the auto-generated excerpt is built (length, truncation) | `src/lib/excerpt.ts` (`generateExcerpt`) |
| Change how many articles show per category on the homepage | `src/components/CategorySection.astro` (the `.slice(0, 5)` line) |
| Change the homepage hero | `src/components/Hero.astro` |
| Change nav links, logo, theme toggle behavior | `src/components/Nav.astro` |
| Change footer content | `src/components/Footer.astro` |
| Change how a full article page looks (headline, banner, body text) | `src/pages/[category]/[slug].astro` |
| Add/change the photo gallery on an article | `src/content/<category>/<slug>/gallery/` folder (images) + `src/components/Gallery.astro` (appearance) |
| Change how a category listing page looks | `src/pages/[category]/index.astro` |
| Change the homepage layout/structure | `src/pages/index.astro` |
| Change colors, fonts, spacing site-wide | `src/styles/global.css` |
| Add a static image (not tied to an article) | `public/images/` |
