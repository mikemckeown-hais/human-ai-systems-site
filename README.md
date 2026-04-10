# Human-AI Systems Website

Static website for [human-ai-systems.com](https://human-ai-systems.com).

## Stack

Plain HTML/CSS/JS. No build step required.

## Local Preview

Open any `.html` file directly in your browser from Finder. No server needed.

## Deployment

Hosted on **Cloudflare Pages** (project: `has-site`). Deployment is automatic via native git integration — no GitHub Actions.

- `dev` branch → preview at `dev.has-site.pages.dev`
- `main` branch → production at `human-ai-systems.com`

Standard workflow: push to `dev` → check preview → sync to `main` for production.

## Git Operations

Use `06 Marketing/Website/git_push.py` for all git operations (never raw `git` commands — mounted filesystem causes lock issues).

```bash
# Push changes to dev
python3 git_push.py full "Commit message" origin dev

# Sync dev to main (for production deploy)
python3 git_push.py sync-to-main
```

See `SITE_RULES.md` for the full development and deployment rules.

## Structure

```
human-ai-systems-site/
├── index.html              ← Home page
├── about/index.html        ← About Mike
├── approach/index.html     ← Methodology (Radar/Pilot/Scale)
├── services/index.html     ← Offer architecture
├── sectors/                ← Sector hub + sub-pages
├── insights/               ← Articles hub + sub-pages
├── team/index.html         ← AI team
├── start/index.html        ← Contact CTA
├── privacy/index.html      ← Privacy & legal
├── mike/index.html         ← Mike's profile
├── css/styles.css
├── js/main.js
├── images/
│   ├── hero/ + webp/
│   ├── icons/
│   ├── headshots/ + webp/
│   └── og/
├── sitemap.xml
├── SITE_RULES.md
└── README.md
```
