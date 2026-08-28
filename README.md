# The Synchronizer

Static site for *The Synchronizer*, the official student publication of Catanduanes National High School. Built with [Astro](https://astro.build).

## Local development

```bash
npm install
npm run dev
```

Site runs at `http://localhost:4321`.

## Adding an article (your workflow)

1. A writer sends you a Markdown file + any images for their article.
2. Create a folder for it under the right category:
   ```
   src/content/<category>/<article-slug>/
     index.md
     cover.jpg   (or whatever images the article uses)
   ```
   Categories are: `news`, `events`, `videos`, `sports`.

3. `index.md` needs this frontmatter at the top:
   ```markdown
   ---
   title: "Headline Goes Here"
   date: 2026-07-20
   author: "Writer Name"
   classImage: "pubmat.jpg"
   classImageAlt: "Short description of what's in the image"
   draft: false
   ---

   Article body goes here, in Markdown.
   ```
   Set `draft: true` if you want to hold the article and not publish it yet — it stays out of the build entirely until you flip it to `false`.

   **No `excerpt` field** — the short summary shown on listing cards and in link previews is generated automatically from the title and body at build time (`src/lib/excerpt.ts`), so there's nothing to write by hand. An article with no body yet (title only) just won't show an excerpt until one's added — that's expected, not a bug.

## Adding a video to an article

**Local file (preferred) — same pattern as `/gallery`, no frontmatter needed:**
1. Drop the video file into a `videos` subfolder next to `index.md`:
   ```
   src/content/videos/exam-week/
     index.md
     videos/
       clip.mp4
   ```
2. That's it. It's picked up automatically and shown as the article's playable video. Supported formats: `.mp4`, `.webm`, `.ogv`/`.ogg`, `.mov`. If you put more than one file in the folder, only the alphabetically-first one is used — keep it to one file per article.

**External link (fallback) — only used if the article has no `videos` folder:**
```markdown
videoUrl: "https://www.youtube.com/watch?v=XXXXXXXXXXX"
```
Supported sources: YouTube (including `youtu.be` short links and Shorts), Vimeo, Facebook video (a `facebook.com/.../videos/...` or `fb.watch/...` link), or a direct file link ending in `.mp4`/`.webm`/`.ogg`. Handy if you'd rather point at an existing upload (e.g. one already posted to the Facebook page) than store a copy of the file in the repo.

Either method works on an article in **any** category, not just `videos` — use it on a `news` or `sports` article if the story itself is a video.

Once set (either way):
- The article's own page shows a full-width, responsive video player in place of the cover-image banner.
- Listing cards and the homepage hero show a small play-button badge over the thumbnail. For YouTube links specifically, the thumbnail is pulled automatically from YouTube itself if the article has no `classImage` or gallery photo — local video files don't have an auto-thumbnail, so set a `classImage` (or add a `/gallery` photo) if you want a custom thumbnail rather than the plain gradient placeholder.
- `classImage` still works alongside a video — it won't be shown on the article page (the video plays there instead), but it's still used as the card/hero thumbnail.

## Adding an image to an article

Two ways, and you can use either or both on the same article:

**Cover image (`classImage`) — shows beside the headline on that article's own page (unless the article has a `videoUrl`, in which case the video plays there instead), and in the homepage hero if it's the featured article. This is where your pubmat graphics go:**
1. Drop the image file into the article's folder, next to `index.md`:
   ```
   src/content/news/barangay-ordinance/
     index.md
     pubmat.jpg
   ```
2. Reference the filename in frontmatter:
   ```markdown
   classImage: "pubmat.jpg"
   classImageAlt: "News Update pubmat"
   ```
   Any filename works (`photo.png`, `header.webp`, etc.) — just make sure it matches what's in the folder. If an article has no `classImage` set, it falls back to the brand gradient thumbnail automatically.

**Images inside the article body:**
Reference the same folder-relative path directly in Markdown:
```markdown
![Caption or alt text](cover.jpg)

Article text continues...
```
You can add as many inline images as the article needs — each one just needs to be a file sitting in that article's folder.

Both cases are automatically compressed and converted to WebP at build time, so you don't need to resize or optimize images yourself before uploading.

## Adding a photo gallery to an article

For articles with multiple photos — event coverage, "In Photos" posts, etc. — add a `gallery` folder inside the article's folder:

```
src/content/news/school-fair/
  index.md
  gallery/
    01-opening-program.jpg
    02-booth-lineup.jpg
    03-alumni-homecoming.jpg
```

That's it — no frontmatter needed. If the folder exists and has images, a photo gallery section (titled "In Photos") automatically appears at the bottom of that article's page, with a click-to-enlarge lightbox. If there's no `gallery` folder, or it's empty, nothing shows — the section is fully optional per article.

**Ordering:** photos display in alphabetical filename order, so name them with a number prefix (`01-`, `02-`, `03-`...) to control the order they appear in — this is how you set "chronological" order for an event.

**Alt text:** automatically generated from the filename (dashes/underscores become spaces, the number prefix is stripped) — e.g. `02-booth-lineup.jpg` becomes "booth lineup". This is what screen readers announce; it's always present even if you skip captions.

**Captions (optional):** add a `captions.json` file inside the same `gallery` folder to show real caption text under each photo in the lightbox:

```
src/content/news/school-fair/
  index.md
  gallery/
    01-opening-program.jpg
    02-booth-lineup.jpg
    03-alumni-homecoming.jpg
    captions.json
```

```json
{
  "01-opening-program.jpg": "Opening program at the covered court, 8 AM.",
  "02-booth-lineup.jpg": "Science department's volcano exhibit drew the longest line."
}
```

You don't have to caption every photo — any filename left out of `captions.json` (like `03-alumni-homecoming.jpg` above) just shows no caption in the lightbox, no error. And if you skip `captions.json` entirely, the whole gallery still works exactly as before, just without caption text.

## Which image shows where

Cards (homepage sections, category listings, "More in [category]") and the article's own header/hero don't necessarily show the same photo:

| Location | Shows |
|---|---|
| Card thumbnail (any listing grid) | The article's **first gallery photo** (sometimes called the "featured image" — it's automatic, not a field you set) if it has one, otherwise its `classImage` frontmatter field, otherwise (if it has a `videoUrl` pointing to YouTube) YouTube's own thumbnail for that video, otherwise the brand gradient placeholder. A play-button badge is layered on top for any article with `videoUrl` set. |
| Article page header (beside the headline) | If the article has `videoUrl`, a full-width playable video embed instead of a static image. Otherwise, the `classImage` frontmatter field. |
| Homepage hero (when that article is featured) | The article's **first gallery photo** if it has one, otherwise its `classImage` frontmatter field, otherwise (if it has a `videoUrl` pointing to YouTube) YouTube's own thumbnail, otherwise the feather illustration placeholder. Video articles show a play-button badge and link straight to the article to watch. |

This is intentional: if you're using a shared graphic (like a "News Update" or "Sports" template pubmat) as an article's `classImage`, multiple articles can end up looking identical in a grid. Cards instead pull each article's first gallery photo — a real, unique photo — so they stay visually distinct from each other, while the article's own page still shows your branded pubmat front and center.

Neither the gallery's photo order nor which photo counts as "first" is something you set in frontmatter — it's always the alphabetically-first file in that article's `gallery/` folder, which is why the `01-`, `02-` filename prefixes matter (see "Adding a photo gallery" above).

4. Commit and push:
   ```bash
   git add .
   git commit -m "Add: <headline>"
   git push
   ```
5. Cloudflare Pages picks up the push automatically and redeploys. No manual build step needed.

## Deploying to Cloudflare Pages (first-time setup)

1. Push this repo to GitHub.
2. In Cloudflare Pages, create a project and connect the GitHub repo.
3. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Deploy. Every future push to the main branch triggers an automatic rebuild.

## Search

The nav's search icon (top right, next to the theme toggle) opens a search bar with two
filters — article type, and a rolling date range (past day/week/month/year) — and submits to
`/search`. That page adds a third control, sort: by date, popularity (views), or length (word
count), each ascending or descending. Everything's a plain `?q=&type=&range=&sort=` query
string, so results are linkable/shareable and the page works with JavaScript off (the sort
dropdown just needs an explicit form submit instead of auto-submitting on change).

Text search matches title, author, and body (Markdown stripped first, so it searches the prose
writers actually typed, not `**bold**`/`[link](url)` syntax) — every word in the query has to
appear somewhere in that combined text.

## Popularity tracking (KV setup)

The "popularity" sort on `/search` counts article page views, stored in a Cloudflare KV
namespace bound as `VIEWS`. Until that namespace exists and is bound, popularity tracking is a
safe no-op — `src/lib/views.ts` treats a missing binding as "0 views for everything," not an
error, so nothing breaks if you skip this section entirely and only use date/length sort.

To turn it on:

1. Create the namespace (needs a Cloudflare account, done once):
   ```bash
   npx wrangler kv namespace create VIEWS
   ```
   This prints an `id`. Paste it into `wrangler.toml` in place of
   `REPLACE_WITH_YOUR_KV_NAMESPACE_ID` — that's what lets `npm run dev` simulate the namespace
   locally.
2. In the Cloudflare Pages dashboard, open this project → **Settings → Functions → KV
   namespace bindings** → add a binding named `VIEWS` pointing at the namespace you just
   created. This is the step that makes it work in production — `wrangler.toml` alone doesn't
   affect the existing git-based deploy described above.
3. Redeploy (push to `main`, same as any other change). Every article view increments its
   count from then on; there's no backfill for views before this was set up.

Skipping this entirely is fine — the site works the same either way, "Most popular" and "Least
popular" just won't be able to tell articles apart until it's configured.

## Project structure

- `src/content/<category>/<slug>/index.md` — one folder per article, image lives alongside it
- `src/pages/[category]/index.astro` — auto-generates the four category pages (News, Events, Videos, Sports)
- `src/pages/[category]/[slug].astro` — auto-generates every individual article page
- `src/pages/index.astro` — homepage (featured hero + up to 5 articles per category)
- `src/components/` — Nav, Footer, ArticleCard, CategorySection, Hero
- `src/lib/categories.ts` — the single place category labels/blurbs are defined

## Theme

Dark/light toggle is in the top nav, top-right. Preference is remembered per visitor (stored in their browser). Defaults to dark on first visit.
#   c n h s - s y n c h r o n i z e r  
 