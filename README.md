# CBSE Prep

A static website for CBSE Classes 8, 9 and 10 — chapter notes, a Top 25 Q&A
flip-card set, and a mock paper for every subject and chapter. Pure
HTML/CSS/JS, no backend, no build step, no database.

## How the site is put together

Everything is driven by **one manifest file**, `content/index.json`, which
lists every class → subject → chapter. The site reads that file and renders
all navigation from it. Adding new content is just:

1. Add (or find) the class/subject/chapter entry in `content/index.json`.
2. Drop matching Markdown files into the matching folder.
3. Refresh the page. No code changes, no build, no deploy step beyond
   uploading the new files.

### Why a hand-maintained manifest instead of auto-generating it?

The brief asked for either an auto-generated manifest or a hand-editable
one, whichever serves the project better — here's the reasoning:

Because this is a **zero-build static site** (by design, so you can edit
Markdown and refresh — no `npm run build` step), there's no server-side
process to regenerate `index.json` automatically on every request. Auto-
generating it would need a build step, which trades away the "just drop in
a file" workflow the brief asked for.

So `content/index.json` is the hand-maintained source of truth. It's a
plain JSON file with a predictable shape (see below) — you'll mostly be
copy-pasting an existing chapter entry and changing the title/id.

If you'd rather not hand-write JSON when adding a lot of new chapters at
once, there's an **optional** helper: run `node tools/generate-index.mjs`
from the project root. It scans the `content/` folder tree and adds any
missing class/subject/chapter entries it finds on disk (inferring a title
from the folder name), without touching or deleting anything you've
already written by hand. It never overwrites existing entries, so it's
always safe to run.

## Folder structure

```
/
├── index.html              Single-page app shell
├── manifest.json            PWA manifest
├── service-worker.js        Offline caching
├── robots.txt / sitemap.xml SEO
├── css/styles.css           All styling (design tokens at the top)
├── js/
│   ├── data.js               Fetches index.json + markdown files
│   ├── markdown.js           marked.js wrapper + qna/mock-paper parsers
│   ├── views.js               Renders every screen
│   ├── flipcards.js           Q&A flip-card grid + Study Mode
│   ├── protection.js          Casual-copy deterrents (see note below)
│   ├── theme.js                Light / Night Study mode toggle
│   ├── pwa.js                  Install-app button + service worker registration
│   ├── router.js               Hash-based router (#/class-9/science/...)
│   └── app.js                  Wires it all together
├── vendor/marked.min.js     Vendored copy of marked.js (no CDN dependency)
├── icons/                   PWA icons
├── tools/generate-index.mjs Optional manifest-sync helper (see above)
└── content/
    ├── index.json            <- THE MANIFEST. Edit this to add content.
    ├── class-8/
    │   ├── mathematics/
    │   │   └── chapter-01-rational-numbers/
    │   │       ├── summary.md      <- full worked sample
    │   │       ├── qna.md          <- full worked sample (25 Q&A)
    │   │       └── mock-paper.md   <- full worked sample
    │   ├── science/
    │   ├── social-science/
    │   ├── english/
    │   └── hindi/
    ├── class-9/  (same shape)
    └── class-10/ (same shape)
```

**Only one chapter has real content files** —
`class-8/mathematics/chapter-01-rational-numbers` — as the complete worked
sample the brief asked for. Every other chapter listed in `index.json` is
scaffolding: the site will show a friendly "Content coming soon" screen for
it until you add the matching `.md` files. This also means the 96 chapter
titles pre-filled into `index.json` are a **starting scaffold** based on
long-standing NCERT chapter names — CBSE periodically rationalises the
syllabus, so please check titles/order against the current official
syllabus (cbseacademic.nic.in) before publishing, and edit freely.

## Adding a new chapter (the normal workflow)

Say you want to add Class 9 → Science → Chapter 9 "Force and Laws of
Motion" — wait, that one's Class 9 already scaffolded; let's use a fresh
example: **Class 9 → Science → Chapter 9 "Gravitation"**.

1. **Add the folder:**
   ```
   content/class-9/science/chapter-09-gravitation/
   ```
2. **Add three files inside it:** `summary.md`, `qna.md`, `mock-paper.md`
   (see the exact format rules below — or just copy the sample chapter's
   three files and edit them).
3. **Add the entry to `content/index.json`**, inside
   `classes[].subjects[]` where `id` is `"science"` under `"id": "class-9"`:
   ```json
   { "id": "chapter-09-gravitation", "number": 9, "title": "Gravitation" }
   ```
4. Save, refresh the site. Done — no rebuild needed.

### Adding a whole new subject

Add a subject object to the relevant class's `subjects` array:
```json
{ "id": "computer-science", "label": "Computer Science", "icon": "generic", "chapters": [] }
```
`icon` can be `mathematics`, `science`, `social-science`, `english`,
`hindi`, or `generic` (used as a fallback for anything else — feel free to
add a new SVG to the `SUBJECT_ICONS` map in `js/views.js` if you want a
bespoke icon for a new subject).

### Adding a whole new class

Add a class object at the top level of `classes`:
```json
{ "id": "class-11", "label": "Class 11", "tagline": "...", "subjects": [] }
```
Home page class-card colours are set in `js/views.js` (`CLASS_ACCENTS`) —
add an entry there if you want a distinct accent colour for the new class.

## Exact Markdown formats (the parser depends on these)

### `summary.md` — plain Markdown
Headings, lists, bold/italic, tables — rendered as-is with marked.js. No
special structure required.

### `qna.md` — strict pattern, parsed by `MD.parseQnA()` in `js/markdown.js`
```markdown
### Q1: What is a rational number?
The answer goes here. It can span multiple paragraphs,
lists, and **bold** text.

### Q2: Next question...
...
```
Rules the parser relies on:
- Each question **must** start with `### Q<number>:` exactly (three
  hashes, then `Q`, digits, a colon).
- Everything after that heading, up to the next `### Q` heading (or end of
  file), becomes that question's answer — and is itself rendered as
  Markdown, so paragraphs/lists/bold all work in the answer.
- The brief calls for 25 Q&A pairs, but the parser will happily render any
  number — the "Top 25" framing is just the site's content goal, not a
  hard limit enforced in code.

### `mock-paper.md` — metadata + sections + answer key
```markdown
## Time Allowed: 3 hours
## Maximum Marks: 80
## General Instructions
- Bullet list of instructions...

## Section A — 1 Mark Questions
1. Numbered questions...

## Section B — 3 Mark Questions
...

## Answer Key
1. Numbered answers...
```
Rules the parser relies on:
- Every block starts with a `## ` heading; the parser classifies each
  block by matching the heading text (case-insensitive):
  - Starts with **"Time Allowed"** → shown in the metadata bar.
  - Starts with **"Maximum Marks"** → shown in the metadata bar.
  - Exactly **"General Instructions"** → shown in a dashed instructions box.
  - Starts with **"Section"** → rendered as a numbered exam section. If the
    heading contains a dash (`Section A — 1 Mark Questions`), the part
    after the dash becomes a small "marks" badge.
  - Starts with **"Answer Key"** → hidden behind a "Show answers" toggle.
  - Anything else is still rendered (as a plain section), so a heading
    that doesn't match one of the patterns above never silently
    disappears — it just won't get the special styling.

## Feedback form

The "Share feedback" link in the footer (`#/feedback`) lets visitors send you
a message — content corrections, bug reports, suggestions — without needing
any backend or database. It works via **Web3Forms**
(https://web3forms.com), a free service built specifically for static sites:
submissions are emailed straight to you, and nothing is stored on this site.

**One-time setup (required — the form won't send anything until you do this):**
1. Go to https://web3forms.com and enter the email address you want feedback
   sent to. No account or password needed.
2. You'll receive an **Access Key** by email — a short string.
3. Open `js/feedback.js` and replace `REPLACE_WITH_YOUR_WEB3FORMS_ACCESS_KEY`
   with that key.
4. Deploy, then submit the form once yourself to confirm the email arrives.

Until you do this, the form will show a friendly "not fully set up yet"
message instead of silently failing — so you'll notice immediately if you
forget this step, rather than losing real feedback from visitors.

A hidden honeypot field filters out basic bot spam without needing a
CAPTCHA.

## Content protection — please read before relying on this

`js/protection.js` adds a right-click-disable, a selection-disable, a
copy/cut block with a small toast, a drag-disable on images, blocked
Ctrl/Cmd+C / S / P shortcuts, and a faint repeating watermark — but **only
as deterrents against casual copy-pasting**. None of this is real content
security: anything rendered in a browser can still be captured (view-
source, browser dev tools, a screen reader, or simply a screenshot). Please
don't present this to students or parents as making the notes uncopyable —
it just raises the bar a little. `user-select: none` does not affect
screen readers, so this doesn't compromise accessibility (see below).

## Accessibility

- Semantic headings and landmarks throughout (`<header>`, `<main>`,
  `<footer>`, `<nav>` for breadcrumbs).
- Flip cards are real, focusable, `role="button"` elements with
  `aria-pressed` state and flip on **Enter** or **Space**, not just click.
- The mock paper's "Show/Hide answers" toggle uses `aria-expanded`.
- Colour choices target WCAG AA contrast in both light and Night Study mode.
- `prefers-reduced-motion` is respected — animations are effectively
  disabled for people who've asked their OS for that.
- A "Skip to content" link is the first focusable element on every page.

## A note on SEO

This is a client-side single-page app using hash-based routing
(`#/class-9/science/...`) so that the whole thing works with **zero**
server configuration on any static host, and the browser's native
Back/Forward buttons work for free. The tradeoff: URL fragments after `#`
are never sent to the server and generally aren't indexed as separate
pages by search engines, so individual chapter pages won't show up
distinctly in search results as-is — only the homepage will.

If ranking for individual chapters/subjects in search matters to you, the
fix is a **prerendering step**: a small script (using something like
Puppeteer, or a static-site generator) that visits every route at build
time and saves a real static HTML file per chapter to a public folder,
which you'd deploy alongside this app. That's a genuine build step, so
it's presented here as an optional upgrade rather than baked in, given the
brief's zero-build-step goal for day-to-day content editing.

## Deployment

This is a static site — any static host works. Three common options:

### Netlify
1. Push this folder to a Git repository (GitHub/GitLab/Bitbucket).
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Build command: leave blank. Publish directory: `/` (the project root).
4. Deploy. Netlify serves `index.html` and all routes work immediately —
   no redirect rules needed, because routing is hash-based.

### Vercel
1. Push to a Git repository.
2. In Vercel: **Add New → Project**, import the repo.
3. Framework preset: **Other**. Build command: none. Output directory: `.`
4. Deploy.

### GitHub Pages
1. Push this folder to a repository.
2. Repo **Settings → Pages → Source**: deploy from the `main` branch, root
   folder.
3. Your site will be live at `https://<username>.github.io/<repo>/`.
   Because routing is hash-based, GitHub Pages needs no special 404
   fallback trick.

After deploying, update `sitemap.xml` and `robots.txt` with your real
domain in place of `https://your-domain.example`.

### Running it locally

Because the browser needs to `fetch()` `content/index.json` and the
Markdown files, opening `index.html` directly from disk (`file://`) will
fail in most browsers — you need a local static server. From the project
root:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```
(or `npx serve`, or any other static file server you have handy).
