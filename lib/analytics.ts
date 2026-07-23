"use client";

/**
 * Privacy-conscious analytics adapter (Mission 7 Part 12).
 *
 * Disabled by default: with no NEXT_PUBLIC_ANALYTICS_PROVIDER configured,
 * trackEvent() is a complete no-op — nothing is collected, no network
 * request is made, no third-party script is loaded. This is deliberate:
 * shipping this release should not silently start sending player data
 * anywhere without an explicit decision to turn a provider on.
 *
 * What this deliberately never sends, even once a provider is wired up:
 * player names, room codes, question text/answers, or anything else
 * identifying a specific person or specific Bible-quiz content — only
 * coarse event names + non-identifying properties (e.g. "level": 3,
 * "language": "am"). Every call is wrapped so a failure here can never
 * break gameplay.
 *
 * To wire up a real provider later: implement the network call inside
 * trackEvent() below, gated on the provider env var, and add that
 * provider's domain to connect-src in next.config.mjs (the current CSP
 * will otherwise silently block it).
 */

const PROVIDER = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;

export function trackEvent(name: string, properties?: Record<string, string | number | boolean>): void {
  if (!PROVIDER) return;
  // No provider is wired up yet — see the doc comment above for how to add
  // one. Intentionally a no-op until a provider is actually configured;
  // wrap the real call in try/catch so analytics can never throw and
  // interrupt gameplay.
}

export function isAnalyticsEnabled(): boolean {
  return Boolean(PROVIDER);
}
