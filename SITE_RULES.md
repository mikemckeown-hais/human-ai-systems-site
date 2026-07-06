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
| `team/` | `/team/` | AI team and Mike's virtual workforce |
| `start/` | `/start/` | Get started / contact CTA page |
| `privacy/` | `/privacy/` | Privacy & legal |
| `mike/` | `/mike/` | Mike's CV page for recruiters (noindexed) |
| `dashboard/` | `/dashboard/` | Ops dashboard (noindexed, behind Cloudflare Access, robots-disallowed) |
| `legal/` | `/legal/` | MSA PDFs |

### Navigation

Primary nav: **Approach** (`/approach/`) · **Services** (`/services/`) · **Training** (`/training/`) · **Sectors** (`/sectors/`) · **Insights** (`/insights/`) · **About** (`/about/`) · **Start** (`/start/`, CTA button)

The home page retains an `id="approach"` anchor for backward compatibility. `/from-prompt-to-autopilot/` is deliberately not in the primary nav: it is surfaced by the site-wide announcement bar (the `fpa-banner` div at the top of `<body>` on every public page except the FPA page, `/mike/` and `/dashboard/`), a homepage spotlight section, callouts on Services and Training, and the footer nav. Remove the announcement bar when the founding cohort closes. Footer nav includes From Prompt to Autopilot on all pages.

### Platform files (repo root)

- `robots.txt`: allows all, disallows `/dashboard/`, references the sitemap
- `404.html`: branded not-found page, picked up automatically by Cloudflare Pages
- `_headers`: security headers site-wide, long cache for `/images/` and `/audio/`
- `llms.txt`: short site description for AI crawlers
- `sitemap.xml`: keep updated when pages are added; entries carry `lastmod`

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

For images, always use WebP with a PNG fallback:

```html
<picture>
  <source srcset="/images/hero/webp/filename.webp" type="image/webp">
  <img src="/images/hero/filename.png" alt="Description">
</picture>
```

---

## Image Assets

All images live inside `images/` in the repo root and deploy automatically with the site.

- `images/hero/` — full-width hero images (PNG originals)
- `images/hero/webp/` — WebP versions of hero images (use these in `<source>`)
- `images/icons/` — service/feature icons (SVG)
- `images/headshots/` — Mike's professional photos
- `images/headshots/webp/` — WebP versions of headshots
- Logos: `images/Logo Dark.svg`, `images/Logo Light.svg`, `images/Logo Mark.svg`

Consult `06 Marketing/Brand/image-library.md` in the workspace before selecting hero images — it has brand-fit ratings and suggested use cases for every image.

---

## Technical Constraints

- No external fonts beyond those approved in visual-brand.md
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
- **How the script works:** Uses the **GitHub REST API directly**, no local git subprocess calls. This bypasses all EPERM/index.lock issues on the Google Drive mounted filesystem. Local git state (`.git/`) is read-only (for the token only); it is never written to.
- **Available commands:** `status`, `add`, `commit`, `push`, `full` (atomic add+commit+push), `sync-to-main`, `log [branch] [n]`
- **Preferred command is `full`**: it detects all locally-changed files automatically (including deletions, which are removed from GitHub), uploads them as blobs, creates a single commit, and updates the branch ref atomically. No risk of partial state.
- **Zero-byte guard:** `full`/`commit` skip zero-byte files with a warning, protecting against Google Drive virtual-filesystem placeholders being pushed as empty files. To push a genuinely empty file, check it on disk first and use explicit `add` + `commit`.
- **Changelog is automated:** `sync-to-main` appends a dated entry to `CHANGELOG.md` listing the commits being released, pushes it to `dev`, then fast-forwards `main`. Do not hand-edit release entries.
