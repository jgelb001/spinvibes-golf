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

// Only accept requests from these origins — blocks external abuse
const ALLOWED_ORIGINS = [
  'https://spinvibes.com',
  'https://www.spinvibes.com',
  'https://golf.spinvibes.com',  // guide builder
  'http://localhost',             // local dev
  'http://127.0.0.1',            // local dev
];

function getAllowedOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  return ALLOWED_ORIGINS.find(o => origin.startsWith(o)) || null;
}

const CORS_HEADERS = (origin) => ({
  'Access-Control-Allow-Origin': origin || 'https://spinvibes.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-SpinVibes-Token',
});

export default {
  async fetch(request, env) {
    const origin = getAllowedOrigin(request);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      if (!origin) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: CORS_HEADERS(origin) });
    }

    // Block requests from unknown origins
    if (!origin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify shared secret — blocks wrong tokens but allows missing token
    // (missing = old cached app version; wrong = external abuse attempt)
    const token = request.headers.get('X-SpinVibes-Token') || '';
    if (env.WORKER_SECRET && token && token !== env.WORKER_SECRET) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS(origin) },
      });
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
          system:     body.system || body.systemPrompt,   // support both field names
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

    // Extract text and return in { reply } format the app expects
    const replyText = data?.content?.[0]?.text || "Sorry, I couldn't get a read on that. Try again.";

    return new Response(JSON.stringify({ reply: replyText }), {
      status: anthropicRes.status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS(origin) },
    });
  },
};
