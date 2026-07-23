import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Mission 12 — migrated from capacitor.config.json (kept every field that
 * config had: appId, appName, webDir, server.url/cleartext) to a typed
 * config so plugin defaults and an env-driven dev server URL can live
 * alongside it, instead of a second ad hoc mechanism.
 *
 * Remote-URL mode (decided in a prior session — see DEPLOYMENT.md's
 * "Mobile packaging" section): the native shell loads the real, deployed
 * Next.js app directly in a WebView rather than bundling a static export.
 * `webDir: "www"` is a required-but-unused placeholder — Capacitor always
 * prefers `server.url` when present. This is what keeps every server-backed
 * feature (Supabase auth, Live Battle's SSR room pages, the AI Question
 * Factory's service-role-key admin routes, rate limiting) working
 * identically to the website: the WebView is just a dedicated browser for
 * that one URL, nothing is statically re-exported or rewritten.
 *
 * CAPACITOR_SERVER_URL lets `pnpm run mobile:android`/`mobile:ios` point at
 * a local dev server (e.g. `http://192.168.1.23:3000` — a real LAN IP, not
 * `localhost`, since the URL is loaded by the device/emulator, not this
 * machine) instead of production, without editing this file. Leave it unset
 * to load the production Vercel deployment, which is what a release build
 * must always do.
 */
const devServerUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.menorah.biblequiz",
  appName: "Menorah Bible Quiz",
  webDir: "www",
  server: {
    url: devServerUrl || "https://menorah-bible-quiz.vercel.app",
    // Only ever cleartext (http) for an explicit local dev override — a
    // release build always resolves to the hardcoded https production URL
    // above, which is never cleartext.
    cleartext: Boolean(devServerUrl?.startsWith("http://")),
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: true,
      backgroundColor: "#080d22",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      // The app is dark-navy-themed throughout with no light-mode toggle
      // (see tailwind.config.ts — navy/gold palette only), so "Light" style
      // (light-colored status bar icons/text, for a dark background) is
      // correct as both the cold-start default and the steady-state value
      // components/mobile/NativeAppBootstrap.tsx sets at runtime.
      style: "LIGHT",
      backgroundColor: "#080d22",
      overlaysWebView: false,
    },
    Keyboard: {
      // "body" resizes the WebView's content area when the keyboard opens
      // (rather than "native", which pans/scrolls) — needed so the Friends
      // Battle player-name inputs and any future text field stay visible
      // above the keyboard instead of being covered by it.
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
