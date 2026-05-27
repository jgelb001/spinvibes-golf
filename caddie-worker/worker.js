// SpinVibes Golf — Caddie Worker
// Cloudflare Worker: proxies caddie requests to Anthropic API
// API key stored as CF secret — never exposed to browser
//
// Deploy:
//   cd caddie-worker
//   npx wrangler deploy
//   npx wrangler secret put ANTHROPIC_API_KEY   ← paste key when prompted
//
// After deploy, update CADDIE_URL in src/11-script.html

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    // Forward to Anthropic — key never leaves the server
    let anthropicRes;
    try {
      anthropicRes = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model:      body.model      || 'claude-haiku-4-5-20251001',
          max_tokens: body.max_tokens || 80,
          system:     body.system,
          messages:   body.messages,
        }),
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Upstream fetch failed', detail: String(err) }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const data = await anthropicRes.json();

    return new Response(JSON.stringify(data), {
      status: anthropicRes.status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  },
};
