"use client";

/**
 * Error-reporting adapter (Mission 7 Part 11). Disabled by default: with
 * no provider configured, reportError() only logs to the console — it
 * never makes a network call, so it's safe to call unconditionally from
 * error boundaries without adding a third-party dependency or a CSP
 * connect-src exception just to ship this release.
 *
 * To wire up a real provider later (e.g. Sentry):
 *   1. `npm install @sentry/nextjs` and follow its setup wizard.
 *   2. Replace the body of reportError() below with the provider's
 *      capture call.
 *   3. Add the provider's ingest domain to connect-src in next.config.mjs
 *      — the current CSP will silently block the report otherwise.
 *   4. Set the provider's DSN as a server + NEXT_PUBLIC_ env var (never
 *      hardcode it).
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  try {
    // eslint-disable-next-line no-console
    console.error("[error-boundary]", error, context);
  } catch {
    // Reporting must never itself throw and mask the original error.
  }
}
