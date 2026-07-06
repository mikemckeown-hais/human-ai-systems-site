// Cloudflare Pages Function — click-tracking "doorman".
// Route: /r/:campaign/:code   e.g.  /r/JUN-WEBINAR/7F3
//
// What it does, in order:
//   1. Reads the campaign and the per-person code from the URL.
//   2. Logs the click to the Google Sheet (form:'visit' -> Visits tab) using the
//      SAME pipeline as the website forms (FORMS_WEBHOOK_URL -> Apps Script).
//      Logging runs in the background via waitUntil, so it never slows or breaks
//      the redirect.
//   3. 302-redirects the visitor to the campaign's destination page.
//
// Add a campaign by adding one line to CAMPAIGNS below. Unknown campaigns are
// still logged and fall back to the site home, so nobody ever hits a dead end.
//
// Config (Cloudflare Pages -> Settings -> Environment variables), already set:
//   FORMS_WEBHOOK_URL    — the Apps Script web app /exec URL (required for logging)
//   FORMS_SHARED_SECRET  — optional shared secret, also set in the Apps Script

const CAMPAIGNS = {
  'JUN-WEBINAR': 'https://human-ai-systems.com/webinar/stop-prompting/',
  // From Prompt to Autopilot programme site (John/Third Circle build).
  // Currently the Replit URL; when John moves to the custom domain, update
  // this one line and every HAS link, email and post keeps working.
  'FPA': 'https://prompt-autopilot.replit.app/?utm_source=human-ai-systems&utm_medium=referral&utm_campaign=fpa',
};

const FALLBACK = 'https://human-ai-systems.com/';

export async function onRequest(context) {
  const { request, env, params } = context;

  const campaign = (params.campaign || '').toUpperCase();
  const code = (params.code || '').trim();
  const destination = CAMPAIGNS[campaign] || FALLBACK;

  // The click record. form:'visit' routes it to the Visits tab in the Sheet.
  const visit = {
    form: 'visit',
    code: code,
    campaign: campaign,
    destination: destination,
    visited_at: new Date().toISOString(),
    country: request.headers.get('cf-ipcountry') || '',
    user_agent: request.headers.get('user-agent') || '',
    referer: request.headers.get('referer') || '',
  };
  if (env.FORMS_SHARED_SECRET) visit.secret = env.FORMS_SHARED_SECRET;

  // Fire-and-forget logging. A logging failure must never affect the redirect.
  if (env.FORMS_WEBHOOK_URL) {
    const log = fetch(env.FORMS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visit),
      redirect: 'follow',
    }).catch(() => {});
    if (context.waitUntil) context.waitUntil(log);
  }

  // no-store so the CDN never caches the redirect and skips the function (which
  // would lose the logging) on repeat clicks.
  return new Response(null, {
    status: 302,
    headers: {
      Location: destination,
      'Cache-Control': 'no-store',
    },
  });
}
