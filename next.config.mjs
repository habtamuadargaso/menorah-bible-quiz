// Mission 7 Part 8/9: production deployment config + security headers.
//
// The Supabase host is derived from NEXT_PUBLIC_SUPABASE_URL at build time
// so connect-src is scoped to the actual project instead of a wildcard.
function supabaseConnectSrc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return ["https://*.supabase.co", "wss://*.supabase.co"];
  try {
    const host = new URL(url).host;
    return [`https://${host}`, `wss://${host}`];
  } catch {
    return ["https://*.supabase.co", "wss://*.supabase.co"];
  }
}

/**
 * A per-request nonce CSP (middleware-based) was built and tested against
 * every route first — see git history for middleware.ts. It was reverted:
 * most routes here are statically prerendered (Mission 6 Part 8 deliberately
 * optimized for this), and a nonce can only be baked into HTML that's
 * rendered per-request. Forcing every route to dynamic rendering just to
 * support nonces would undo that optimization for a marginal script-src
 * gain. 'unsafe-inline' on script-src is therefore a deliberate, tested
 * tradeoff, not an oversight — it's needed for Next's own inline hydration
 * scripts. What this CSP still meaningfully blocks: loading any script
 * from a non-'self' origin, framing this site (frame-ancestors 'none'),
 * and outbound connections to anything other than this origin + this
 * project's own Supabase instance. Tested against every route (home, solo
 * play, Friends Battle, Live Battle setup/host/play, admin dashboard,
 * settings) with zero console errors before shipping — see
 * RELEASE_CHECKLIST.md. Do not tighten script-src further without
 * re-running that same route sweep.
 */
function buildCsp() {
  const connect = supabaseConnectSrc().join(" ");
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${connect}`,
    "media-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Content-Security-Policy", value: buildCsp() },
        ],
      },
      {
        // Admin surfaces should never be indexed or cached at the edge.
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        // Private room URLs (contain a room code) — never indexed, never
        // cached at the edge (Mission 7 Part 16).
        source: "/multiplayer/host/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/multiplayer/play/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
