# Human-AI Systems Website

Static website for [human-ai-systems.com](https://human-ai-systems.com).

## Stack

Plain HTML/CSS/JS. No build step required.

## Local Preview

Open any `.html` file directly in your browser from Finder. No server needed.

## Deployment

Hosted on Cloudflare Pages. Deployment is automatic:

- `dev` branch → staging (`dev.human-ai-systems.com`)
- `main` branch → production (`human-ai-systems.com`)

Push to the appropriate branch and Cloudflare handles the rest.

## Workflow

See `AI_OPERATING_MODEL.md` for the full development and deployment model, including the AI agent workflow and git conventions.

## Structure

```
human-ai-systems-site/
├── index.html
├── about.html
├── services.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── images/
│   ├── hero/
│   ├── icons/
│   ├── headshots/
│   └── og/
├── AI_OPERATING_MODEL.md
├── SITE_RULES.md
├── CHANGELOG.md
└── README.md
```
