// Cloudflare Pages Function — social-link "doorman".
// Route: /s/<code>/<optional/destination/path>
//   /s/LI-007/insights/why-pilots-fail/  -> logs LI-007, redirects to that page
//   /s/FB-001                            -> logs FB-001, redirects to the homepage
//
// <code> identifies the social POST. The platform is encoded in the prefix
// (LI = LinkedIn, FB = Facebook, IG = Instagram, X = X, etc.), so the system is
// platform-agnostic: any new platform is just a new prefix, no code change.
//
// Everything after the code is treated as an ON-SITE destination path, and the host
// is always pinned to human-ai-systems.com, so a social link can never redirect
// off-site (no open-redirect risk). Each click is logged to the Social tab in the
// Sheet via the same FORMS_WEBHOOK_URL pipeline as the forms and the /r/ doorman,
// then the visitor is 302-redirected. Logging runs in the background (waitUntil) so
// it never slows or breaks the redirect.

const SITE = 'https://human-ai-systems.com';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // pathname like /s/LI-007/insights/why-pilots-fail/
  const segments = url.pathname.split('/').filter(Boolean); // ["s","LI-007","insights",...]
  const code = segments[1] || '';
  const destPath = segments.slice(2).join('/');

  let destination = SITE + (destPath ? '/' + destPath : '/');
  // keep a trailing slash if the original had one (site pages are directories)
  if (destPath && url.pathname.endsWith('/') && !destination.endsWith('/')) destination += '/';
  if (url.search) destination += url.search;

  const hit = {
    form: 'social',
    code: code,
    destination: destination,
    clicked_at: new Date().toISOString(),
    country: request.headers.get('cf-ipcountry') || '',
    user_agent: request.headers.get('user-agent') || '',
    referer: request.headers.get('referer') || '',
  };
  if (env.FORMS_SHARED_SECRET) hit.secret = env.FORMS_SHARED_SECRET;

  if (env.FORMS_WEBHOOK_URL) {
    const log = fetch(env.FORMS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hit),
      redirect: 'follow',
    }).catch(() => {});
    if (context.waitUntil) context.waitUntil(log);
  }

  return new Response(null, {
    status: 302,
    headers: { Location: destination, 'Cache-Control': 'no-store' },
  });
}
