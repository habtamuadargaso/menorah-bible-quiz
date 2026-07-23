/**
 * Deep link → in-app path resolution, kept as a pure function (no
 * Capacitor/router imports) so it's trivially unit-testable and so
 * NativeAppBootstrap.tsx stays a thin wrapper around it.
 *
 * Two supported forms, both resolving to the exact same in-app routes:
 *
 * 1. Custom scheme — `menorah://<path>[?query]` mirrors the web path
 *    exactly, e.g. `menorah://settings` -> `/settings`,
 *    `menorah://multiplayer/join?room=ABCD` -> `/multiplayer/join?room=ABCD`.
 *    Registered natively (AndroidManifest.xml intent-filter, iOS
 *    CFBundleURLTypes) — works with zero server-side setup, so it's the
 *    one guaranteed to work everywhere immediately.
 * 2. Universal Links / Android App Links — a real `https://` URL on the
 *    production domain (e.g. shared from the host dashboard's "copy
 *    invite link" button) opens the app directly instead of a browser tab,
 *    once the domain's `.well-known/assetlinks.json` /
 *    `apple-app-site-association` files are verified (see
 *    MOBILE_SETUP.md — this half requires a deployed step this repo can't
 *    perform on its own: filling in the real signing-certificate
 *    fingerprint / Apple Team ID once those exist).
 *
 * A convenience shortcut also exists for the single most shareable link in
 * the app — joining a Live Battle room: `menorah://join/ABC123` (or the
 * Universal Link equivalent `https://<domain>/join/ABC123`) maps to
 * `/multiplayer/join?room=ABC123`, which is what actually joins a room —
 * see app/multiplayer/join/page.tsx's existing `?room=`/`?code=` handling.
 */

const CUSTOM_SCHEME_PREFIX = "menorah://";

function normalizePath(pathAndQuery: string): string {
  const trimmed = pathAndQuery.replace(/^\/+/, "");
  return `/${trimmed}`;
}

/** Returns an in-app path (e.g. "/multiplayer/join?room=ABCD") for a
 * supported deep link, or null if the URL isn't one this app handles —
 * callers should ignore (never crash or navigate on) a null result. */
export function resolveDeepLinkPath(url: string): string | null {
  if (!url) return null;

  if (url.startsWith(CUSTOM_SCHEME_PREFIX)) {
    const rest = url.slice(CUSTOM_SCHEME_PREFIX.length);
    return resolveShortcut(rest) ?? normalizePath(rest || "/");
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    const rest = `${parsed.pathname}${parsed.search}`.replace(/^\//, "");
    return resolveShortcut(rest) ?? normalizePath(rest || "/");
  } catch {
    return null;
  }
}

/** `join/<CODE>` (with or without a leading slash, either link form) ->
 * the real join-room route. Room codes are alphanumeric — see
 * app/multiplayer/join/page.tsx's own `[^A-Z0-9]` filter — so this only
 * ever matches a plausible code, never swallows an unrelated path that
 * happens to start with "join". */
function resolveShortcut(restOfUrl: string): string | null {
  const match = restOfUrl.match(/^\/?join\/([A-Za-z0-9]{1,8})(?:\?.*)?$/);
  if (!match) return null;
  return `/multiplayer/join?room=${encodeURIComponent(match[1].toUpperCase())}`;
}
