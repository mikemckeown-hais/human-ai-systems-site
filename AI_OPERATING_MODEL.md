# AI_OPERATING_MODEL.md — Human-AI Systems Website

Authoritative reference for all AI agents working on this repository.
Defines the system architecture, workflow, and agent responsibilities.

Last updated: 2026-03-19

---

## System Architecture

### Components

- **Repo** (this folder) — source of truth; all files version controlled via git
- **GitHub** — remote repository; `main` and `dev` branches
- **Cloudflare Pages** — deployment; auto-deploys on push to either branch
- **Mac workspace** — Mike's local machine; repo folder is accessible directly

### Environment Mapping

| Environment | Branch | URL |
|-------------|--------|-----|
| Local preview | any | Open HTML file in Finder |
| Staging | `dev` | dev.human-ai-systems.com |
| Production | `main` | human-ai-systems.com |

### Repo Location

The repository lives within Mike's workspace folder, accessible to both Mike and Cowork.
Relative path from workspace root: `06 Marketing/Website/human-ai-systems-site/`

---

## AI Agent Responsibilities

### Build Phase

**ChatGPT** — writes HTML, CSS, JS. Produces complete output in its canvas.
**Cowork** — receives finished files dropped into the repo folder by Mike, then handles all git operations.

Handoff: ChatGPT produces HTML → Mike saves to repo folder → Cowork stages, commits, pushes.

### Maintenance Phase

**Cowork** handles both HTML edits and git operations for minor updates.
ChatGPT used for new full pages only if usage warrants it.

---

## Git Rules

- Work in `dev` branch only — never edit `main` directly
- Never push directly to `main` — only via merge from `dev`
- Stage specific files explicitly — never use `git add .`
- Use concise, imperative commit messages: `Add services page`, `Fix nav spacing`
- Always run `git status` before committing to confirm what is staged

## Branch Workflow

```
dev branch
  → push to GitHub
  → Cloudflare auto-deploys to dev.human-ai-systems.com (staging)
  → Mike reviews and approves
  → merge dev → main
  → Cloudflare auto-deploys to human-ai-systems.com (production)
  → update CHANGELOG.md
```

### Merge command sequence (dev → main):
```bash
git checkout main
git merge dev
git push origin main
git checkout dev
```

---

## Local Preview

No server required. Open HTML files directly in browser from Mac Finder.
Staging (Cloudflare dev deploy) used for final pre-release review.

---

## File Structure

```
human-ai-systems-site/
├── index.html
├── about.html
├── services.html
├── contact.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── images/
│   ├── hero/
│   ├── icons/
│   ├── headshots/
│   └── og/
├── AI_OPERATING_MODEL.md   ← this file
├── SITE_RULES.md
├── CHANGELOG.md
└── README.md
```

Rules:
- Keep HTML files at repo root
- Do not introduce new top-level folders without justification
- Do not create a CLAUDE.md in this repo — primary CLAUDE.md lives in the workspace root

---

## CHANGELOG Rules

Update CHANGELOG.md on every production release (merge dev → main).
Optional update at major staging milestones.

Format:
```
## YYYY-MM-DD
- Short description of change
- Optional rationale if non-obvious
```

---

## Design & Content Constraints

See `SITE_RULES.md` for full design rules.

Key reminders:
- Mobile-first layout
- British English throughout
- No content hidden without non-JS fallback
- No broken image paths
- Core content accessible without JavaScript
