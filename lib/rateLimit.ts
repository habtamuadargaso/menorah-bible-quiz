import type { NextRequest } from "next/server";

/**
 * In-memory sliding-window rate limiter (Mission 7 Part 10).
 *
 * KNOWN LIMITATION, documented rather than silently assumed: this state
 * lives in a single serverless function instance's memory. On Vercel that
 * means a burst of requests landing on different warm instances — or any
 * cold start — resets the count. This is a best-effort backstop against
 * accidental hammering (e.g. a retry loop) and casual abuse, not a hard
 * guarantee against a determined attacker. A real guarantee needs a
 * shared store (Redis/Upstash) — see SECURITY.md for the upgrade path.
 *
 * Also out of scope here entirely: room creation, joining, and answer
 * submission never pass through a Next.js API route — they call Supabase
 * directly from the browser (RLS-protected). No Next.js-layer rate limit
 * can cover them; see SECURITY.md for Supabase-side mitigation options.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

// Prevents unbounded memory growth from a flood of distinct IPs. Not
// itself a defense against that flood — just keeps this process's own
// memory bounded.
const MAX_TRACKED_KEYS = 5000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

function clientKey(request: NextRequest, scope: string): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}

export function checkRateLimit(request: NextRequest, scope: string, limit: number, windowMs: number): RateLimitResult {
  const key = clientKey(request, scope);
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

export function rateLimitResponse(result: RateLimitResult) {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return Response.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
