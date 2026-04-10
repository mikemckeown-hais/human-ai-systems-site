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
| `index.html` (root) | `/` | Home — who Mike is, what HAS does, primary CTA |
| `approach/` | `/approach/` | Full approach page — Radar/Pilot/Scale, Tool/Assistant/Worker, Hybrid Workforce |
| `about/` | `/about/` | Mike's background, credentials, and track record |
| `services/` | `/services/` | Offer architecture — Assess → Pilot → Scale → Lead |
| `sectors/` | `/sectors/` | Sector hub — links to all sector sub-pages |
| `insights/` | `/insights/` | Insights hub — links to all article sub-pages |
| `training/` | `/training/` | AI training workshops — sector-tailored, three tiers |
| `team/` | `/team/` | AI team and Mike's virtual workforce |
| `start/` | `/start/` | Get started / contact CTA page |
| `privacy/` | `/privacy/` | Privacy & legal |

### Navigation note — Approach

**Approach is now a dedicated page** at `/approach/`. The home page retains an `id="approach"` anchor on the summary section for backward compatibility with any existing links.

Primary nav: **Approach** (`/approach/`) · **Services** (`/services/`) · **Sectors** (`/sectors/`) · **Insights** (`/insights/`) · **About** (`/about/`) · **Start** (`/start/` — CTA button)

### Sector sub-pages (under `sectors/`)

| Folder | URL |
|---|---|
| `sectors/financial-services/` | `/sectors/financial-services/` |
| `sectors/local-government/` | `/sectors/local-government/` |
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
- **How the script works:** Uses the **GitHub REST API directly** — no local git subprocess calls. This bypasses all EPERM/index.lock issues on the Google Drive mounted filesystem. Local git state (`.git/`) is read-only (for the token only); it is never written to.
- **Available commands:** `status`, `add`, `commit`, `push`, `full` (atomic add+commit+push), `sync-to-main`, `log`
- **Preferred command is `full`** — it detects all locally-changed files automatically, uploads them as blobs, creates a single commit, and updates the branch ref atomically. No risk of partial state.
