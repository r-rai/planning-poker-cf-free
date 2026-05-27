// functions/api/middleware/rateLimiter.js
// Simple in‑memory token‑bucket rate limiter per IP.
// NOTE: Cloudflare Workers may be reused across requests, allowing us to keep a global Map.
// This is sufficient for the free‑tier low‑traffic use‑case.

const RATE_LIMIT = 120; // max requests per minute per IP (safe for multiple tabs)
const WINDOW_MS = 60 * 1000;
const buckets = new Map(); // ip -> { tokens, lastRefill }

export async function rateLimiter(request) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = { tokens: RATE_LIMIT, lastRefill: now };
    buckets.set(ip, bucket);
  }
  
  // Refill tokens continuously based on elapsed time
  const elapsed = now - bucket.lastRefill;
  if (elapsed > 0) {
    const tokensToAdd = (elapsed / WINDOW_MS) * RATE_LIMIT;
    bucket.tokens = Math.min(RATE_LIMIT, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }
  
  if (bucket.tokens < 1) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.', errorCode: 'ERR_RATE_LIMIT' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', },
    });
  }
  
  bucket.tokens -= 1;
  return null; // no error, continue
}
