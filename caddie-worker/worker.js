// SpinVibes Caddie — Cloudflare Worker
// Routes:
//   POST /           → Claude Haiku caddie (existing)
//   POST /course-search  → GolfCourseAPI search (proxied, key server-side)
//   POST /course-detail  → GolfCourseAPI course detail + tee data
//   POST /parse-scorecard → Claude vision scorecard reader
//
// Secrets (set via wrangler secret put):
//   ANTHROPIC_API_KEY
//   GOLF_COURSE_API_KEY   ← new: sign up free at golfcourseapi.com
//
// Deploy: wrangler deploy

const ALLOWED_ORIGINS = [
  'https://golf.spinvibes.com',
  'https://www.golf.spinvibes.com',
  'https://spinvibes.com',
  'https://www.spinvibes.com',
];

const GOLF_API_BASE = 'https://api.golfcourseapi.com';

export default {
  async fetch(request, env) {
    const origin  = request.headers.get('origin') || request.headers.get('referer') || '';
    const allowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));
    const url     = new URL(request.url);
    const path    = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(origin, allowed) });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (!allowed) {
      console.warn('Blocked origin:', origin);
      return new Response('Forbidden', { status: 403 });
    }

    let body;
    try { body = await request.json(); }
    catch { return new Response('Bad Request: invalid JSON', { status: 400 }); }

    // ── Route ────────────────────────────────────────────────────
    if (path === '/course-search')   return handleCourseSearch(body, env, origin, allowed);
    if (path === '/course-detail')   return handleCourseDetail(body, env, origin, allowed);
    if (path === '/parse-scorecard') return handleParseScorecard(body, env, origin, allowed);
    return handleCaddie(body, env, origin, allowed);
  },
};

// ── Caddie (existing Claude Haiku route) ─────────────────────────
async function handleCaddie(body, env, origin, allowed) {
  const { message, messages, systemPrompt } = body;

  if (!systemPrompt || typeof systemPrompt !== 'string') {
    return new Response('Bad Request: systemPrompt missing', { status: 400 });
  }

  let messageArray;
  if (Array.isArray(messages) && messages.length > 0) {
    const valid = messages.every(m =>
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' && m.content.length <= 2000
    );
    if (!valid || messages.length > 20) {
      return new Response('Bad Request: invalid messages array', { status: 400 });
    }
    messageArray = messages;
  } else if (message && typeof message === 'string' && message.length <= 500) {
    messageArray = [{ role: 'user', content: message }];
  } else {
    return new Response('Bad Request: message or messages required', { status: 400 });
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response('Caddie not configured', { status: 500 });

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        system: systemPrompt,
        messages: messageArray,
      }),
    });
    const data  = await apiRes.json();
    const text  = data.content?.[0]?.text || "Sorry, couldn't read that. Try again.";
    return json({ reply: text }, origin, allowed);
  } catch (err) {
    console.error('Claude API error:', err);
    return new Response('Upstream request failed', { status: 502 });
  }
}

// ── Course Search ─────────────────────────────────────────────────
async function handleCourseSearch(body, env, origin, allowed) {
  const { query } = body;
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return new Response('Bad Request: query required', { status: 400 });
  }

  const apiKey = env.GOLF_COURSE_API_KEY;
  if (!apiKey) return json({ error: 'Course search not configured' }, origin, allowed, 500);

  try {
    const res  = await fetch(
      `${GOLF_API_BASE}/v1/search?search_query=${encodeURIComponent(query.trim())}`,
      { headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' } }
    );
    if (!res.ok) return json({ error: `API error ${res.status}` }, origin, allowed, 502);

    const data    = await res.json();
    const courses = (data.courses || []).slice(0, 12).map(c => ({
      id:       c.id,
      name:     c.club_name || c.course_name || 'Unknown',
      course:   c.course_name !== c.club_name ? c.course_name : null,
      city:     c.location?.city  || '',
      state:    c.location?.state || '',
      country:  c.location?.country || '',
    }));
    return json({ courses }, origin, allowed);
  } catch (err) {
    console.error('Course search error:', err);
    return new Response('Search failed', { status: 502 });
  }
}

// ── Course Detail ─────────────────────────────────────────────────
async function handleCourseDetail(body, env, origin, allowed) {
  const { courseId, teeColor } = body;
  if (!courseId) return new Response('Bad Request: courseId required', { status: 400 });

  const apiKey = env.GOLF_COURSE_API_KEY;
  if (!apiKey) return json({ error: 'Course search not configured' }, origin, allowed, 500);

  try {
    const res = await fetch(
      `${GOLF_API_BASE}/v1/courses/${courseId}`,
      { headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' } }
    );
    if (!res.ok) return json({ error: `API error ${res.status}` }, origin, allowed, 502);

    const raw     = await res.json();
    const data    = raw.course || raw;           // API wraps in { course: { ... } }
    const maleTees   = data.tees?.male   || [];
    const femaleTees = data.tees?.female || [];
    const allTees    = [...maleTees, ...femaleTees];

    // Try to match requested tee color (case-insensitive), fall back to first male tee
    let tee = null;
    if (teeColor) {
      tee = maleTees.find(t => t.tee_name?.toLowerCase() === teeColor.toLowerCase())
         || allTees.find(t => t.tee_name?.toLowerCase() === teeColor.toLowerCase());
    }
    if (!tee) tee = maleTees[0] || allTees[0];

    // Only expose male tees in the switcher (avoids confusing women's ratings)
    const teeList = maleTees.map(t => ({
      name:   t.tee_name,
      rating: t.course_rating || null,
      slope:  t.slope_rating  || null,
      yards:  t.total_yards   || null,
      par:    t.par_total     || null,
    }));

    const course = {
      name:      data.club_name || data.course_name || '',
      course:    data.course_name && data.course_name !== data.club_name ? data.course_name : null,
      city:      data.location?.city  || '',
      state:     data.location?.state || '',
      par:       tee?.par_total || null,
      holes:     (tee?.holes || []).length || 18,
      holePars:  (tee?.holes || []).map(h => h.par),
      yardages:  (tee?.holes || []).map(h => h.yardage),
      rating:    tee?.course_rating || null,
      slope:     tee?.slope_rating  || null,
      teeColor:  tee?.tee_name || teeColor || 'White',
      allTees:   teeList,
    };

    return json({ course }, origin, allowed);
  } catch (err) {
    console.error('Course detail error:', err);
    return new Response('Detail fetch failed', { status: 502 });
  }
}

// ── Parse Scorecard (Claude vision) ──────────────────────────────
async function handleParseScorecard(body, env, origin, allowed) {
  const { image, mediaType, teeColor } = body;
  if (!image || !mediaType) {
    return new Response('Bad Request: image and mediaType required', { status: 400 });
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response('Not configured', { status: 500 });

  const prompt = `You are reading a golf scorecard photo. Extract ONLY these fields and return valid JSON, nothing else:
{
  "name": "course name",
  "city": "city",
  "state": "state abbreviation",
  "par": total par as number,
  "holes": 9 or 18,
  "teeColor": "${teeColor || 'White'}",
  "rating": course rating as decimal number or null,
  "slope": slope rating as integer or null,
  "holePars": [array of par per hole],
  "yardages": [array of yardage per hole from the ${teeColor || 'White'} tee row]
}
If you cannot read a value clearly, use null. Return ONLY the JSON object.`;

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text',  text: prompt },
          ],
        }],
      }),
    });

    const data = await apiRes.json();
    const text = data.content?.[0]?.text || '';

    let course;
    try {
      // Strip any markdown fences if present
      const cleaned = text.replace(/```json|```/g, '').trim();
      course = JSON.parse(cleaned);
    } catch {
      return json({ error: 'Could not parse scorecard — try a clearer photo' }, origin, allowed, 422);
    }

    return json({ course }, origin, allowed);
  } catch (err) {
    console.error('Parse scorecard error:', err);
    return new Response('Upstream failed', { status: 502 });
  }
}

// ── Helpers ───────────────────────────────────────────────────────
function cors(origin, allowed) {
  return {
    'Access-Control-Allow-Origin':  allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-SpinVibes-Token',
  };
}

function json(data, origin, allowed, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(origin, allowed) },
  });
}
