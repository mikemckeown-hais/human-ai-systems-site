// Cloudflare Pages Function — proxies analytics requests to Cloudflare GraphQL API
// Endpoint: /api/analytics?days=7
// Keeps API token server-side (no CORS issues, no token exposure)

const CF_TOKEN   = 'cfat_Mw5vMBQ0NLB2g0mbgMVFSXMBlSEIaYsV0sptwrM6ebbe1e97';
const ACCOUNT_ID = '3614369217d7b85560ee32bbf8437012';
// No siteTag filter — account has one domain, capture all RUM data
const GQL_URL    = 'https://api.cloudflare.com/client/v4/graphql';

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const days = parseInt(url.searchParams.get('days') || '7');

  // Clamp days to sensible range
  const safeDays = Math.min(Math.max(days, 1), 365);

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - safeDays);

  const startISO = start.toISOString().split('T')[0] + 'T00:00:00Z';
  const endISO   = end.toISOString().split('T')[0] + 'T23:59:59Z';

  const filter = `{AND: [{datetime_geq: "${startISO}"}, {datetime_leq: "${endISO}"}]}`;
  const timeGranularity = safeDays <= 1 ? 'datetimeHour' : 'date';

  const query = `{
    viewer {
      accounts(filter: {accountTag: "${ACCOUNT_ID}"}) {

        timeline: rumPageloadEventsAdaptiveGroups(
          filter: ${filter}, limit: 200, orderBy: [${timeGranularity}_ASC]
        ) { count dimensions { ${timeGranularity} } }

        pages: rumPageloadEventsAdaptiveGroups(
          filter: ${filter}, limit: 20, orderBy: [count_DESC]
        ) { count dimensions { requestPath } }

        referrers: rumPageloadEventsAdaptiveGroups(
          filter: ${filter}, limit: 20, orderBy: [count_DESC]
        ) { count dimensions { refererHost } }

        countries: rumPageloadEventsAdaptiveGroups(
          filter: ${filter}, limit: 15, orderBy: [count_DESC]
        ) { count dimensions { countryName } }

        devices: rumPageloadEventsAdaptiveGroups(
          filter: ${filter}, limit: 15, orderBy: [count_DESC]
        ) { count dimensions { deviceType userAgentBrowser } }

        visits: rumPageloadEventsAdaptiveGroups(
          filter: ${filter}, limit: 1
        ) { count sum { visits } }

      }
    }
  }`;

  try {
    const res = await fetch(GQL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    const json = await res.json();

    return new Response(JSON.stringify(json), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'  // cache 5 min
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
