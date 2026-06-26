// Cloudflare Pages Function — POST /api/track
//
// Receives a click "beacon" from a page. The on-page recorder reads ?e=CODE when
// the page loads and POSTs it here; this function enriches it and forwards it to
// the Google Sheet as a 'visit' via the same FORMS_WEBHOOK_URL pipeline used by
// the forms and the /r/ and /s/ doormen.
//
// This is the EMAIL tracking method: the email links point straight at the real
// page (e.g. /webinar/stop-prompting/?e=CODE), so there is no second redirect for
// Gmail's link checker to warn about. Same origin, so no CORS needed. Bots and
// link-scanners that don't run JavaScript never fire this, which keeps the data
// cleaner than the redirect approach.

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const code = (data.code || '').toString().trim();
  if (!code) return json({ ok: false, error: 'code required' }, 400);

  const payload = {
    form: 'visit',
    code: code,
    campaign: (data.campaign || '').toString(),
    destination: (data.page || request.headers.get('referer') || '').toString(),
    visited_at: new Date().toISOString(),
    country: request.headers.get('cf-ipcountry') || '',
    user_agent: request.headers.get('user-agent') || '',
    referer: request.headers.get('referer') || '',
  };
  if (env.FORMS_SHARED_SECRET) payload.secret = env.FORMS_SHARED_SECRET;

  if (!env.FORMS_WEBHOOK_URL) {
    return json({ ok: false, error: 'tracking backend not configured' }, 503);
  }

  try {
    const res = await fetch(env.FORMS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    if (!res.ok) return json({ ok: false, error: 'upstream ' + res.status }, 502);
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: e.message }, 502);
  }
}

export async function onRequestGet() {
  return json({ ok: false, error: 'Method not allowed' }, 405);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
