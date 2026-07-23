# Mobile Setup — Capacitor (Mission 12)

This app ships to Android and iOS as a **Capacitor-wrapped native shell around
the exact same Next.js app that runs on the web** — not a rewrite, not a
static export, not a second codebase. There is exactly one app; this document
covers the native packaging layer around it.

## Architecture: remote-URL mode

`capacitor.config.ts` sets `server.url` to the production Vercel deployment
(`https://menorah-bible-quiz.vercel.app`). Capacitor's native shell loads that
URL directly into a WebView, the same way a regular browser would, instead of
bundling a static (`next export`) copy of the site. `webDir: "www"` exists
only because Capacitor's CLI requires *some* directory to be present — it's
never actually used while `server.url` is set.

This was decided in a prior session (see `DEPLOYMENT.md`'s original "Mobile
packaging" note) and this mission kept it, because it's the only approach
that doesn't require rewriting anything:

- The AI Question Factory, admin dashboard, bulk translation actions, and
  every other `/api/admin/*` route depend on the `SUPABASE_SERVICE_ROLE_KEY`
  server-side secret (CLAUDE.md rule 3: never expose it to a client). A
  static export has no server at all — those routes simply couldn't exist.
- Live Battle's room pages (`/multiplayer/host/[code]`, `/multiplayer/play/[code]`)
  and most `/api/*` routes are dynamically server-rendered (`ƒ` in the build
  output), not static.
- A static export would force rewriting all of the above against some other
  backend shape — exactly what the mission says not to do.

So the native app is, functionally, **a dedicated browser for one URL**.
Everything that works on the website works identically inside the app,
because it's the same request/response traffic to the same Vercel deployment
and the same Supabase project. Capacitor's plugin bridge (status bar, splash
screen, haptics, deep links, keyboard) is injected into the WebView
regardless of whether the page it loaded is local or remote, so all of that
still works even though no web code is bundled into the app itself — see
`components/mobile/NativeAppBootstrap.tsx`.

**Consequence**: the app requires network connectivity for anything
server-backed (auth, Solo Play's database questions, Live Battle, AI
Factory/admin). The one thing that's genuinely offline is Friends Battle's
static local question bank fallback — see "Offline assets" below.

## Prerequisites

| Tool | Why | Version used to verify this mission |
|---|---|---|
| Node.js | Building the Next.js app | >=24 (`engines.node`) |
| pnpm | This repo's package manager (`packageManager` in `package.json`) | 10.34.5 |
| JDK | Building the Android project with Gradle | 21 (Temurin, via `brew install openjdk@21`) |
| Android SDK (`platform-tools`, `platforms;android-36`, `build-tools;36.0.0`) | Android build | via `brew install --cask android-commandlinetools` + `sdkmanager` |
| Xcode + CocoaPods/SPM | Building the iOS project | Not available in this session (see "What wasn't verified" below) |

None of this is bundled with the repo — every developer/CI machine building
the native projects needs its own JDK + Android SDK (and, for iOS, Xcode on
macOS). `android/local.properties` (which points Gradle at your local SDK
install) is machine-specific and already gitignored — regenerate it locally
with:

```bash
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

## Project layout

```
capacitor.config.ts          Capacitor config (server URL, plugin defaults)
assets/logo.svg              Source artwork for icon/splash generation
android/                     Generated native Android project (Gradle)
ios/                          Generated native iOS project (Xcode)
lib/mobile/
  deepLinks.ts                Pure URL -> in-app-path resolver (unit-testable)
  haptics.ts                  hapticSelection/hapticSuccess/hapticError — no-ops on web
components/mobile/
  NativeAppBootstrap.tsx      Mounted once (via Providers.tsx); no-op on web,
                              wires status bar/splash/back-button/deep-links
                              when Capacitor.isNativePlatform() is true
public/.well-known/
  assetlinks.json             Android App Links verification (needs your real
                              release-signing SHA-256 — see "Deep links")
  apple-app-site-association  iOS Universal Links verification (needs your
                              real Apple Team ID — see "Deep links")
```

## Build scripts

```bash
pnpm run mobile:sync     # next build && cap sync — run this after any
                          # plugin/config change, or after `pnpm install`
                          # adds/updates a Capacitor plugin
pnpm run mobile:android   # mobile:sync, then opens the project in Android Studio
pnpm run mobile:ios       # mobile:sync, then opens the project in Xcode
pnpm run mobile:assets    # regenerate all icon/splash images from assets/logo.svg
                          # (run after changing the app's logo/branding)
```

These are plain `package.json` scripts, so `npm run mobile:android` (as
written in the mission brief) works too — the project's own convention is
pnpm (`DEPLOYMENT.md`), so prefer `pnpm run mobile:android` for lockfile
consistency, but either invokes the same script.

## What's configured

### App icon & splash screen

Generated from `assets/logo.svg` (a copy of `public/icon.svg`, the existing
menorah mark) via `@capacitor/assets`:

```bash
npx @capacitor/assets generate --iconBackgroundColor '#080d22' --iconBackgroundColorDark '#080d22' --splashBackgroundColor '#080d22' --splashBackgroundColorDark '#080d22'
```

(wired up as `pnpm run mobile:assets`). `#080d22` is the app's own
`navy-950` brand color (`tailwind.config.ts`). This produced:

- Every Android adaptive-icon density + launcher icon + splash drawable
  (light and dark/night variants) under `android/app/src/main/res/`.
- The iOS `AppIcon`/`Splash` image sets under
  `ios/App/App/Assets.xcassets/`.
- PWA icons at `public/icons/icon-{48,72,96,128,192,256,512}.png`, wired into
  `app/manifest.ts`'s `icons` array — this also closes a gap flagged (but not
  fixed, no rasterization tool available then) in a prior mission's
  `DEPLOYMENT.md` PWA audit.

Android's launch theme (`android/app/src/main/res/values/styles.xml`,
`AppTheme.NoActionBarLaunch`) already referenced `@drawable/splash` from the
original `npx cap add android` scaffold — no changes needed there, the
generated `splash.png` drawables just fill in what was already wired up.
`SplashScreen.hide()` is called once `NativeAppBootstrap` mounts (i.e. once
the real page has loaded and hydrated), not on a fixed timer — see its doc
comment for why.

### Status bar

`capacitor.config.ts`'s `plugins.StatusBar` sets the cold-start defaults
(style `Light` — light icons/text, since the app has a dark navy theme with
no light-mode variant; background `#080d22`; `overlaysWebView: false` so the
status bar reserves its own space instead of drawing over app content).
`NativeAppBootstrap.tsx` re-asserts the same values at runtime once mounted
(belt-and-suspenders — the config block is the reliable cold-start value,
the runtime call covers any case where the native default raced ahead of it).

### Safe area

`viewport-fit=cover` was already set (a prior mission, `app/layout.tsx`'s
`viewport` export) — that's what makes `env(safe-area-inset-*)` resolve to a
real value instead of a no-op. This mission adds one rule in
`app/globals.css`, scoped to `html.native-app` (a class only
`NativeAppBootstrap.tsx` ever adds, only inside the native shell — the
website/PWA is completely unaffected):

```css
html.native-app body {
  padding-bottom: env(safe-area-inset-bottom);
}
```

Capacitor's WebView is edge-to-edge by default and most screens here anchor
real controls near the bottom (answer buttons, nav bars, submit buttons), so
this pads every screen for the home indicator / Android gesture bar
automatically. The status bar's own inset is handled by `overlaysWebView:
false` instead (see above), not by top padding.

The app already had opt-in `.safe-area-padding` / `.safe-area-padding-bottom`
utility classes from an earlier mission; those are unrelated and untouched
(still available for any component that wants to opt in specifically,
website or native).

### Keyboard

`capacitor.config.ts`'s `plugins.Keyboard` sets `resize: "body"` —
resizes the WebView's content area when the on-screen keyboard opens, rather
than panning the whole page, so text inputs (Friends Battle's player-name
fields, any future text field) stay visible above the keyboard instead of
being covered by it.

### Haptic feedback

`lib/mobile/haptics.ts` exports three functions
(`hapticSelection`/`hapticSuccess`/`hapticError`), each a no-op on the
website (guarded by `Capacitor.isNativePlatform()`) and never throwing (a
disabled-haptics device or a native call failure is swallowed, since
feedback is an enhancement, not a dependency of the interaction it's
attached to). Wired into the two places a player already gets audio
feedback for right/wrong, so haptics always fires alongside the existing
sound effect rather than as a separate, easily-forgotten system:

- `components/QuizCard.tsx`'s `handleAnswer` (Solo Play) — success/error
  haptic next to `playCorrectSound`/`playWrongSound`.
- `components/friendsBattle/FriendsBattleReveal.tsx` — same pattern for the
  shared pass-and-play reveal.

Not wired into Live Battle's reveal screen this mission — a reasonable next
step, not done here to keep this change's blast radius contained to two
call sites plus the shared helper.

### Deep links

Two supported forms, both resolved by the pure, unit-testable
`lib/mobile/deepLinks.ts::resolveDeepLinkPath()`:

1. **Custom scheme — `menorah://...`**. Works immediately, no server-side
   verification needed. Mirrors the web path exactly:
   `menorah://settings` -> `/settings`,
   `menorah://multiplayer/join?room=ABCD` -> `/multiplayer/join?room=ABCD`.
   A shortcut also exists for the single most shareable link in the app —
   joining a Live Battle room: `menorah://join/ABC123` ->
   `/multiplayer/join?room=ABC123` (reuses `app/multiplayer/join/page.tsx`'s
   existing `?room=`/`?code=` handling, no changes needed there).
   - Android: `AndroidManifest.xml`'s `MainActivity` has a
     `VIEW`/`BROWSABLE`/`DEFAULT` intent-filter for `scheme="menorah"`.
   - iOS: `Info.plist`'s `CFBundleURLTypes` registers the `menorah` scheme.
     `AppDelegate.swift`'s default `application(_:open:options:)` (already
     present from the original `npx cap add ios` scaffold) forwards to
     `ApplicationDelegateProxy`, which is what makes `@capacitor/app`'s
     `appUrlOpen` listener fire — no AppDelegate changes were needed.

2. **Universal Links (iOS) / App Links (Android) — real `https://` URLs**
   on the production domain open the app directly instead of a browser tab.
   This half needs one manual step this repo can't perform on its own,
   because it requires credentials that don't exist in a repository:

   - **Android**: `public/.well-known/assetlinks.json` has a placeholder
     `sha256_cert_fingerprints` value. Once you have a release signing key,
     replace it with that key's real SHA-256 fingerprint:
     ```bash
     keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
     ```
     `AndroidManifest.xml` already has the `autoVerify="true"` intent-filter
     for `https://menorah-bible-quiz.vercel.app` — it just won't verify
     until the real fingerprint is deployed at that path. Until then, these
     links keep opening in the browser exactly as they do today (safe
     degradation, not a broken state).
   - **iOS**: `public/.well-known/apple-app-site-association` has a
     placeholder Team ID. Replace `REPLACE_WITH_YOUR_APPLE_TEAM_ID` with
     your real 10-character Apple Developer Team ID. `ios/App/App/App.entitlements`
     already declares `applinks:menorah-bible-quiz.vercel.app` — attach it
     to the target in Xcode (Signing & Capabilities -> + Capability ->
     Associated Domains -> confirm this entitlements file is selected).
     This one step needs a human in Xcode; it isn't something a text edit
     to the `.pbxproj` can safely do unattended.

   Both files are served from `public/.well-known/` (Next.js serves
   `public/` statically), so once deployed to Vercel they're automatically
   live at the paths Android/iOS check.

**Testing the custom scheme without a real device**: once an emulator/device
has the app installed,
```bash
adb shell am start -W -a android.intent.action.VIEW -d "menorah://join/ABC123" com.menorah.biblequiz
```

## Feature parity checklist

Because this is remote-URL mode (same app, same server, same database),
every feature works identically to the website — verified by inspection of
what actually changed (nothing in application logic, only native shell
config) rather than by claiming a device test that wasn't run in this
session:

| Feature | Status | Why |
|---|---|---|
| Supabase authentication | Unaffected | Same browser-storage-backed anonymous auth, same origin, same Supabase project — the WebView persists storage across app restarts like any browser profile. |
| Multiplayer / Live Battle | Unaffected | `/multiplayer/host/[code]`, `/multiplayer/play/[code]`, and Supabase Realtime (wss) all load from the real server exactly as on web; CSP's `connect-src` already scopes to `'self'` + the Supabase host, both still correct from inside the WebView. |
| Solo Play | Unaffected | `loadQuestionsForGame.ts` (local bank + published DB translations) is unchanged; runs from the same served JS. |
| Friends Battle | Unaffected, plus haptics | Same merged local-bank + published-DB-translation logic (see the prior mission's work); haptic feedback added on the reveal screen. |
| AI Question Factory / admin dashboard | Unaffected | Still server-only, still gated by `isAuthorizedAdmin()` + the service-role key, which never ships to any client, native or web. |
| Offline assets | Friends Battle's local bank still works fully offline once the page has loaded; everything else (Solo Play's DB content, Live Battle, auth, AI Factory) requires connectivity, same as the website. No service worker exists (a prior mission's `DEPLOYMENT.md` PWA audit flagged this as a known, deliberate gap, not something this mission adds) — a cold app launch with zero connectivity fails to load the shell at all, same limitation the website already has. |

## What was verified this mission

Run in this environment (macOS, no pre-existing Java/Android SDK/Xcode):

```bash
pnpm test               # 16/16 passed
pnpm run build           # next build — compiled, typechecked, 0 errors
npx cap sync             # copied web assets, registered all 5 new plugins
                          # for both android and ios
```

Then, after installing a JDK (`brew install openjdk@21` — no sudo needed)
and the Android SDK command-line tools (`brew install --cask
android-commandlinetools`, then `sdkmanager platform-tools
"platforms;android-36" "build-tools;36.0.0"` — also no sudo needed):

```bash
cd android && ./gradlew assembleDebug
# BUILD SUCCESSFUL in 28s, 243 actionable tasks
# -> android/app/build/outputs/apk/debug/app-debug.apk (4.6 MB)
```

**What wasn't verified**: an actual iOS build (`xcodebuild`/Xcode), since
Xcode requires macOS with the full IDE installed (not just command-line
tools) and isn't available in this sandboxed session — only command line
tools were present, and `xcodebuild` refuses to run without the full Xcode
app. Also not verified: running the built APK on a device/emulator, real
deep-link taps on a device, or an actual App Store/Play Store release build
(out of scope per the mission's own "no actual app-store publishing").

To verify iOS locally:
```bash
pnpm run mobile:ios   # opens ios/App/App.xcworkspace in Xcode
# In Xcode: select a simulator, Product -> Build (Cmd+B)
```

## Known manual follow-ups (not automatable from here)

- Real Android release-signing keystore + its SHA-256 fingerprint in
  `public/.well-known/assetlinks.json` (App Links).
- Real Apple Developer Team ID in
  `public/.well-known/apple-app-site-association`, plus attaching
  `App.entitlements` to the Xcode target's Associated Domains capability
  (Universal Links).
- Code signing, app icons for store listings, privacy manifests, and actual
  App Store Connect / Google Play Console submission — all out of scope per
  the mission brief.
- If `CAPACITOR_SERVER_URL` is ever used to point at a local dev server for
  testing, remember it must be a real LAN IP (e.g. `http://192.168.1.23:3000`),
  not `localhost` — the URL is loaded by the device/emulator, not this
  machine.
