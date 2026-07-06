// Cloudflare Pages Function — receives form submissions and forwards them to a
// Google Apps Script web app that appends each one to a Google Sheet.
// Endpoint: POST /api/submit
//
// Handles two forms, distinguished by the `form` field in the JSON body:
//   "interest"   — Register Your Interest  (/from-prompt-to-autopilot/register/)
//   "newsletter" — Field-notes subscription  (insights pages)
//   "feedback" — Webinar Feedback        (/webinar/stop-prompting/feedback/)
//
// Configuration (Cloudflare Pages → Settings → Environment variables):
//   FORMS_WEBHOOK_URL   — the Apps Script web app /exec URL (required)
//   FORMS_SHARED_SECRET — optional shared secret, also set in the Apps Script
//
// Keeps the webhook URL and secret server-side. No CORS needed (same origin).

export async function onRequestPost(context) {
  const { request, env } = context;

  // Parse the body
  let data;
  try {
    data = await request.json();
  } catch (err) {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  // Basic validation
  const form = (data.form || '').toLowerCase();
  if (form !== 'interest' && form !== 'feedback' && form !== 'newsletter') {
    return json({ ok: false, error: 'Unknown form type' }, 400);
  }
  if (form === 'interest' || form === 'newsletter') {
    const email = (data.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ ok: false, error: 'A valid email is required' }, 400);
    }
  }

  // Enrich with request metadata (handy for triage, not shown to the user)
  data.country = request.headers.get('cf-ipcountry') || '';
  data.user_agent = request.headers.get('user-agent') || '';
  if (!data.submitted_at) data.submitted_at = new Date().toISOString();
  if (env.FORMS_SHARED_SECRET) data.secret = env.FORMS_SHARED_SECRET;

  // If the backend is not wired yet, fail clearly rather than silently dropping leads
  if (!env.FORMS_WEBHOOK_URL) {
    return json({ ok: false, error: 'Forms backend not configured (FORMS_WEBHOOK_URL missing)' }, 503);
  }

  // Forward to the Apps Script web app
  try {
    const res = await fetch(env.FORMS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      redirect: 'follow'
    });

    if (!res.ok) {
      return json({ ok: false, error: 'Upstream error ' + res.status }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: err.message }, 502);
  }
}

// Reject non-POST methods cleanly
export async function onRequestGet() {
  return json({ ok: false, error: 'Method not allowed' }, 405);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
