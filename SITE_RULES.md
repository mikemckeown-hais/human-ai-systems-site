# SITE_RULES.md — Human-AI Systems Website

Design, UX, and content rules for human-ai-systems.com.
All AI agents working on this site must follow these rules.

---

## Design Principles

- Mobile-first layout — all styles start at small screen, expand upward
- No content hidden without a non-JS fallback
- No broken image paths — always verify image assets exist before referencing
- Keep pages lightweight — no heavy frameworks, no unnecessary JS
- Prefer clean whitespace over dense layouts

## Brand

- Colours, fonts, and logo usage: refer to `10 Product & IP/Brand/visual-brand.md` in the workspace
- All copy in British English — organise, colour, recognise, programme, behaviour, analyse
- Tone: refer to `10 Product & IP/Brand/brand-voice.md` in the workspace

## Layout Standards

- Navigation: consistent across all pages
- Footer: consistent across all pages — include email and LinkedIn
- CTA (call to action): every page should have a clear next step

---

## URL & File Structure

The site uses **directory-based routing**. Every page lives in its own folder with an `index.html` file. This gives clean URLs without `.html` extensions.

**Rule: never create a page as a flat `.html` file in the root. Always use a folder.**

### Pattern

| What to create | File to create | Resulting URL |
|---|---|---|
| Top-level page | `about/index.html` | `human-ai-systems.com/about/` |
| Sub-page under a hub | `sectors/financial-services/index.html` | `human-ai-systems.com/sectors/financial-services/` |
| Home page (only exception) | `index.html` (root) | `human-ai-systems.com/` |

### Adding a new page — checklist

1. Create a new folder with a descriptive, lowercase, hyphenated name
2. Create `index.html` inside that folder
3. Copy nav and footer HTML from an existing page for consistency
4. Use root-relative paths for all internal links (see Link Conventions below)
5. Set correct `<title>`, `<meta name="description">`, `<link rel="canonical">`, and `og:url` — all using the new clean URL (e.g. `https://human-ai-systems.com/about/`)
6. Add the page to the nav on all other pages if it is a primary nav item

### Adding a sub-page under a hub — checklist

Same as above, but nest the folder inside the hub folder. Example for a new sector page:
- Create `sectors/new-sector/index.html`
- Update `sectors/index.html` to link to the new sub-page
- URL will be `human-ai-systems.com/sectors/new-sector/`

---

## Current Page Inventory

### Top-level pages

| Folder | URL | Purpose |
|---|---|---|
| `index.html` (root) | `/` | Home: who Mike is, what HAS does, primary CTA |
| `approach/` | `/approach/` | Full approach page: Radar/Pilot/Scale, Tool/Assistant/Worker, Hybrid Workforce |
| `about/` | `/about/` | Mike's background, credentials, and track record |
| `services/` | `/services/` | Offer architecture: Assess → Pilot → Scale → Lead |
| `sectors/` | `/sectors/` | Sector hub, links to all sector sub-pages |
| `insights/` | `/insights/` | Insights hub, links to all article sub-pages |
| `training/` | `/training/` | AI training workshops: sector-tailored, three tiers |
| `from-prompt-to-autopilot/` | `/from-prompt-to-autopilot/` | FPA programme bridge page (indexed). Enrolment lives on the external programme site (John/Third Circle); until its custom domain exists, HAS CTAs point at the register form |
| `from-prompt-to-autopilot/register/` | `/from-prompt-to-autopilot/register/` | FPA interest form → `/api/submit` → Google Sheet |
| `webinar/` | `/webinar/` | Evergreen webinar series hub (indexed). Update monthly with the next session |
| `webinar/stop-prompting/` | `/webinar/stop-prompting/` | June 2026 webinar resources (noindexed) + `feedback/` form |
| `how-has-runs/` | `/how-has-runs/` | How HAS runs on its own Business AI Operating System (indexed). Real small-business case study; serves P2A and consulting. Not in primary nav |
| `team/` | `/team/` | AI team and Mike's virtual workforce |
| `start/` | `/start/` | Get started / contact CTA page |
| `privacy/` | `/privacy/` | Privacy & legal |
| `mike/` | `/mike/` | Mike's CV page for recruiters (noindexed) |
| `legal/` | `/legal/` | MSA PDFs (v1.0, v1.1, v1.2) and AIOS End User Licence Terms (v1.0); short addresses in `_redirects` |
| `business-aios/` | `/business-aios/` | What a Business AI Operating System is, with three short videos (indexed, in primary nav) |
| `business-aios/explorer/` | `/business-aios/explorer/` | Narrated interactive 3D explorer (noindexed, embedded in the page above) |
| `partners/` | `/partners/` | How HAS works with consultants, advisers and firms |
| `from-prompt-to-autopilot/meet-lumen/` | `/from-prompt-to-autopilot/meet-lumen/` | Lumen, the synthetic reference company, with role dashboards |

### Navigation

Primary nav: **Business AIOS** (`/business-aios/`) · **Services** (`/services/`) · **Approach** (`/approach/`) · **Sectors** (`/sectors/`) · **Insights** (`/insights/`) · **About** (`/about/`) · **Start** (`/start/`, CTA button). Training sits in the footer nav, not the primary nav.

The Start button keeps its visible label and carries a hidden suffix for screen readers and link-text checks: `Start<span class="sr-only"> a conversation</span>`. Keep that markup when copying the nav.

The home page retains an `id="approach"` anchor for backward compatibility. `/from-prompt-to-autopilot/` is deliberately not in the primary nav: it is surfaced by the site-wide announcement bar (the `fpa-banner` div at the top of `<body>` on every public page except the FPA page, `/mike/` and `/dashboard/`), a homepage spotlight section, callouts on Services and Training, and the footer nav. Remove the announcement bar when the founding cohort closes. Footer nav includes From Prompt to Autopilot on all pages.

### Platform files (repo root)

- `robots.txt`: allows all, disallows `/dashboard/`, references the sitemap
- `404.html`: branded not-found page, picked up automatically by Cloudflare Pages
- `_headers`: security headers site-wide, long cache for `/images/` and `/audio/`
- `llms.txt`: short site description for AI crawlers
- `sitemap.xml`: keep updated when pages are added; entries carry `lastmod`
- `favicon.ico`: fallback icon for clients that ignore the SVG `<link rel="icon">`
- `assets/site.css`: the shared stylesheet (see below)

### Cloudflare Pages Functions (`functions/`)

- `api/submit.js`: POST endpoint for the site forms. Accepts `form: "interest" | "feedback" | "newsletter"` and forwards to a Google Apps Script web app that appends to a Google Sheet
- `api/track.js`, `api/analytics.js`: click/email beacons
- `r/[campaign]/[code].js`: campaign redirect + click log. Campaign `FPA` points at the From Prompt to Autopilot programme site; when John moves it to the custom domain, update that one line
- `s/[[path]].js`: social-post click-tracking doorman

Env vars (Cloudflare Pages → Settings → Environment variables): `FORMS_WEBHOOK_URL` (required, the Apps Script /exec URL), `FORMS_SHARED_SECRET` (optional). If `FORMS_WEBHOOK_URL` is missing the forms return 503 rather than silently dropping leads.

### Sector sub-pages (under `sectors/`)

| Folder | URL |
|---|---|
| `sectors/financial-services/` | `/sectors/financial-services/` |
| `sectors/local-government/` | `/sectors/local-government/` |
| `sectors/private-equity/` | `/sectors/private-equity/` |
| `sectors/professional-services/` | `/sectors/professional-services/` |
| `sectors/public-sector/` | `/sectors/public-sector/` |
| `sectors/sme/` | `/sectors/sme/` |
| `sectors/technology/` | `/sectors/technology/` |

### Insight articles (under `insights/`)

| Folder | URL |
|---|---|
| `insights/why-pilots-fail/` | `/insights/why-pilots-fail/` |
| `insights/tool-assistant-worker/` | `/insights/tool-assistant-worker/` |
| `insights/governance/` | `/insights/governance/` |
| `insights/hybrid-workflows/` | `/insights/hybrid-workflows/` |
| `insights/operating-model/` | `/insights/operating-model/` |
| `insights/local-government/` | `/insights/local-government/` |
| `insights/running-a-business-on-ai/` | `/insights/running-a-business-on-ai/` |
| `insights/what-is-a-business-ai-operating-system/` | `/insights/what-is-a-business-ai-operating-system/` |

---

## Link Conventions

Always use **root-relative paths** (starting with `/`) for internal links and image references. Never use relative paths like `../` — they break when page depth changes.

```html
<!-- Correct -->
<a href="/about/">About</a>
<a href="/sectors/local-government/">Local Government</a>
<img src="/images/hero/webp/HAIS AI Operations.webp" alt="...">

<!-- Wrong -->
<a href="about.html">About</a>
<a href="../sectors/local-government.html">Local Government</a>
<img src="../../images/hero/HAIS AI Operations.png">
```

For photographs, use the responsive pattern below: WebP at three widths with a JPEG fallback, explicit `width` and `height`, and lazy loading for everything except a full-width hero at the top of a page (`loading="eager" fetchpriority="high"`).

```html
<picture class="ph">
  <source type="image/webp" srcset="/images/photo/slug-640.webp 640w, /images/photo/slug-1024.webp 1024w, /images/photo/slug-1536.webp 1536w" sizes="(max-width: 860px) 100vw, 600px">
  <img src="/images/photo/slug-1024.jpg" alt="What the picture shows" width="1536" height="1024" loading="lazy" decoding="async">
</picture>
```

Set `sizes` to the width the image is shown at on desktop: `600px` in a two-column layout, `1200px` for a full-width strip, `400px` for a card thumbnail.

**Filenames must be lowercase and hyphenated, with no spaces.** A space ends a URL inside `srcset`, so `<source srcset="/images/hero/webp/HAIS AI Operations.webp">` silently fails and the browser loads the 2MB PNG instead. That bug ran site-wide until November 2026. If a legacy file with spaces must be referenced, encode them as `%20`.

---

## Image Assets

All images live inside `images/` in the repo root and deploy automatically with the site.

- `images/photo/` — the photographic set (November 2026): `slug-640.webp`, `slug-1024.webp`, `slug-1536.webp` and `slug-1024.jpg` for each image. Use these.
- `images/illustration/` — concept illustrations for Insights (SVG, shapes only, node motif). Generated by `06 Marketing/Website/redesign-2026-11-11/illus.py`, so regenerate rather than hand-edit
- `images/og/` — one 1200×630 social image per page (`og:image` and `twitter:image`), plus `has-logo-512.png` for structured data
- `images/hero/` and `images/hero/webp/` — the legacy dashboard-heavy set (PNG and WebP). No longer used on the main site. Do not use for new work; still referenced by a few unlisted pages
- `images/icons/` — service/feature icons (SVG)
- `images/headshots/` — Mike's professional photos
- `images/headshots/webp/` — WebP versions of headshots
- Logos: `images/Logo Dark.svg`, `images/Logo Light.svg`, `images/Logo Mark.svg`

Consult `06 Marketing/Brand/image-library.md` in the workspace before selecting images. It lists every photograph, its register and where it is used.

### Imagery rules (November 2026)

- The site draws on five registers: **people at work**, **places**, **close-up details**, **diagrams** and **illustrated concepts**. Mix them within a page.
- No screens as the subject. Dashboards appear only as real product screenshots, and each one must show something different.
- No two pages share a hero. A Sectors hub card may reuse the hero of the page it links to.
- Photographs share one style: documentary, natural overcast light, cool navy and teal grade, British settings. The prompt style block is in `image-library.md`.
- Never use a generated photograph in a way that implies it shows a real named person, client or organisation.
- `/images/*` is cached for a year as immutable. A changed image needs a new filename, or returning visitors keep the old one.

---

## Shared stylesheet

`/assets/site.css` is linked as the last item in `<head>` on every page, after the page's own inline `<style>`, so its rules win on equal specificity. It holds what is common to the whole site: the skip link, focus rings, the reduced-motion rules, the darker Steel Grey for text (`--steel: #5A6B7E`, AA contrast), responsive image rules, the framework diagram styles and the expandable-section pattern. Page-specific layout stays inline in the page. New pages must link it and include `<a class="skip-link" href="#main">Skip to content</a>` as the first element in `<body>`, with `id="main"` on `<main>`.

## Expandable sections

Pages lead with the essentials and keep depth behind native `<details>`/`<summary>`, so the content is in the HTML for search engines and works without JavaScript. Three variants, all styled in `site.css`:

```html
<!-- Boxed: lists and reference detail. Optional hint on the right. -->
<details class="more">
<summary><h3>What you get</h3><span class="more-hint">7 deliverables</span></summary>
<div class="more-body">…</div>
</details>

<!-- Plain: prose that continues a section. -->
<details class="more more-plain">
<summary>More on the context</summary>
<div class="more-body">…</div>
</details>

<!-- Story: an example, labelled "In practice". -->
<details class="more more-story">
<summary><span class="more-kicker">In practice</span> What Radar surfaces, Finance &amp; Operations</summary>
<div class="more-body">…</div>
</details>
```

Rules: the summary says what is inside, never "Read more". Whatever a visitor needs in order to decide whether to keep reading stays outside the expandable. Insights articles are not folded. Add `open` to the first of a group when the group would otherwise show nothing.

## Diagrams and motion

Framework icons (`svg.fw-ico`) are inline SVG built from the node motif: blue for people, aqua for AI, teal in support, Steel Grey connectors. They draw in on scroll using CSS scroll-driven animation only. Browsers without support, and visitors who prefer reduced motion, see the finished diagram. No animation may hide content or delay it.

## Technical Constraints

- No external fonts beyond those approved in visual-brand.md
- Source Sans 3 is self-hosted at `/assets/fonts/` (variable font, weights 400 to 700) and declared in `site.css`. Do not add a Google Fonts link. Each page preloads the latin file: `<link rel="preload" href="/assets/fonts/source-sans-3-latin.woff2" as="font" type="font/woff2" crossorigin />`
- Font stacks read `"Source Sans 3", "Source Sans 3 Fallback", "Segoe UI", Arial, sans-serif`. The fallback is Arial scaled to match, so text wraps the same before and after the font loads
- Set heading and paragraph widths in `em`, never `ch`. A `ch` changes with the font on screen and caused a 0.68 layout shift on sector pages
- External scripts loaded from cdnjs.cloudflare.com only (if needed at all)
- No localStorage or sessionStorage usage
- Core content must be accessible without JavaScript

---

## Commit & Change Discipline

- Make targeted edits — do not rewrite sections that are not being changed
- Do not refactor unless explicitly requested
- Stage specific files only — no `git add .`
- Write concise, imperative commit messages: `Add services page`, `Fix mobile nav`

## Deployment Rules

- **GitHub repo:** `mikemckeown-hais/human-ai-systems-site` (branches: `main` + `dev`)
- **Cloudflare Pages project:** `has-site` — deploys via native git integration (no GitHub Actions)
- **Dev preview:** push to `dev` → auto-deploys to `dev.has-site.pages.dev` (stable URL, always shows latest dev)
- **Production:** push to `main` → auto-deploys to `human-ai-systems.com` / `www.human-ai-systems.com`
- **Standard workflow:** push to `dev` first → check preview → sync to `main` for production
- **Always keep branches in sync.** Dev should always be at least as far ahead as main. Use `git_push.py sync-to-main` to fast-forward main to dev.
- **Use the git helper script** for all git operations — never raw `git` commands. Script: `06 Marketing/Website/git_push.py`.
- **How the script works:** Uses the **GitHub REST API directly**, no local git subprocess calls. This bypasses all EPERM/index.lock issues on the Google Drive mounted filesystem. The token comes from `GITHUB_TOKEN` or `08 Operations/AI Setup/_credentials/github-token.txt`, never from `.git/config` (the remote URL carries no token since 9 Nov 2026; a repo-local credential helper reads the same file for plain `git`). After each push and `sync-to-main` the script updates the local git history (`fetch`, then `reset --mixed`, files untouched) so `git status` stays meaningful; where the folder will not let git remove its lock files it skips that step and prints the command to run later.
- **Available commands:** `status`, `add`, `commit`, `push`, `full` (atomic add+commit+push), `sync-to-main`, `log [branch] [n]`
- **Always pass an explicit file list to `full`** (`python3 git_push.py full "<message>" origin dev path/one path/two`). Without a list it pushes every locally changed file, including anything left dirty by another session. On 11 Nov 2026 a stale local copy of `functions/api/analytics.js` containing a token was caught only by GitHub's push protection.
- **Preferred command is `full`**: it detects all locally-changed files automatically (including deletions, which are removed from GitHub), uploads them as blobs, creates a single commit, and updates the branch ref atomically. No risk of partial state.
- **Zero-byte guard:** `full`/`commit` skip zero-byte files with a warning, protecting against Google Drive virtual-filesystem placeholders being pushed as empty files. To push a genuinely empty file, check it on disk first and use explicit `add` + `commit`.
- **Changelog is automated:** `sync-to-main` appends a dated entry to `CHANGELOG.md` listing the commits being released, pushes it to `dev`, then fast-forwards `main`. Do not hand-edit release entries.
