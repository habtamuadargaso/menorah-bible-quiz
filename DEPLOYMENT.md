# Deployment (Mission 7 Parts 8, 9, 19)

## Target platform

Vercel. `capacitor.config.json` already points at `https://menorah-bible-quiz.vercel.app` — Vercel is the established deployment target for this project, not a new choice made in this mission.

## Runtime requirements

- Node.js >= 24 (`package.json` `engines.node`)
- Package manager: **pnpm** (`packageManager: "pnpm@10.34.5"` in `package.json`) — use `pnpm install` / `pnpm run build`, not `npm`, so the lockfile (`pnpm-lock.yaml` if present) stays authoritative. On Vercel, set the project's package manager to pnpm (Vercel auto-detects this from `packageManager` in most cases; verify in Project Settings -> General -> Build & Development Settings if unsure).
- Build command: `pnpm run build` (runs `next build`, which also type-checks and lints — see below)
- Output: standard Next.js `.next` — no custom `next.config.mjs` `output` mode is set, so Vercel's default Next.js runtime applies (no `vercel.json` is required for this app; only add one if you need to override defaults like redirects/rewrites not already expressible in `next.config.mjs`).

## Environment variables

See `.env.example` for the full annotated list. Set these in Vercel's Project Settings -> Environment Variables, scoped per environment (Production / Preview / Development):

| Variable | Required | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | All |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | All |
| `NEXT_PUBLIC_SITE_URL` | Recommended in Production | Production (defaults to `http://localhost:3000` otherwise — fine for dev, wrong for OG/social metadata in prod) |
| `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`) | Yes, for admin dashboard + AI Factory | All environments that need those features |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Only if using the AI Question Factory | Wherever that feature is used |
| `QUESTION_ADMIN_SECRET` | Local-dev fallback only | Avoid setting in Production once real admin accounts exist — see [ADMIN.md](ADMIN.md) |

`app/layout.tsx` calls `assertPublicEnv()` (`lib/env.ts`) at module scope — a deployment missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` fails fast with a clear, value-free error instead of a confusing downstream Supabase client error.

## Database migrations

Applied manually via the Supabase SQL Editor, in order (this project's established convention — see the root `CLAUDE.md`):

```
supabase/migrations/20260711_final_multiplayer.sql
supabase/migrations/20260718_global_leaderboard.sql
supabase/migrations/20260719_online_live_battle.sql
supabase/migrations/20260722_mission4_fixes.sql
supabase/migrations/20260723_mission7_admin_platform.sql   <- new this mission
supabase/migrations/20260724_mission7_data_retention.sql   <- new this mission
```

All are idempotent — safe to re-run if unsure what's already applied. See [ADMIN.md](ADMIN.md) for the admin-account provisioning step that must follow the two new migrations.

## Security headers & CSP

Configured in `next.config.mjs`. See [SECURITY.md](SECURITY.md#security-headers-mission-7-part-9) for what's set and the tested tradeoff behind `script-src`'s `'unsafe-inline'`. If you change routing structure (new dynamic segments, new static/dynamic split), re-run the CSP route sweep described there before shipping.

## Rate limiting

In-memory, per-instance — see [SECURITY.md](SECURITY.md#rate-limiting-mission-7-part-10) for what it covers and its known multi-instance limitation.

## CI

`.github/workflows/ci.yml` — runs on every push to `main` and every PR: install, secret-scan, `next build` (typecheck included), lint, then (if `QUESTION_ADMIN_SECRET` is configured as a repo secret) starts the production server and runs question-bank validation + the full `tests/regression.mjs` suite against it. Requires repo secrets `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `QUESTION_ADMIN_SECRET` — point these at a non-production Supabase project if you don't want CI runs touching real gameplay data.

## PWA / installability (Mission 7 Part 17)

`app/manifest.ts` is configured (name, short/long description, `standalone` display, theme/background colors). Audited this mission:

- **Icons**: only `public/icon.svg` (`sizes: "any"`). Works for installability in Chromium-based browsers, but there are no PNG icons at the standard 192x192 / 512x512 sizes (including a maskable variant), which iOS's "Add to Home Screen" and some Android launchers render better than a bare SVG. Not generated in this mission — no image-rasterization tool (`sharp`, ImageMagick, `rsvg-convert`) was available in this environment. **Action needed before a polished install experience**: export `icon.svg` to PNG at 192x192, 512x512, and a maskable 512x512 variant, and add them to `app/manifest.ts`'s `icons` array.
- **No service worker**: not added this mission — a broken service worker (stale cache serving old JS against a new API contract) is a real, easy-to-ship-by-accident risk, and this app doesn't strictly need one. Friends Battle already works offline once the page has loaded (zero network calls, by design — see Mission 5B); Live Battle inherently requires connectivity and already shows an explicit offline-blocked banner. The gap a service worker would close: a full page reload while offline currently fails to load the shell at all. Treat as a future enhancement, not a launch blocker, given the above.

## Mobile packaging (Mission 7 Part 18)

**Already decided in a prior session, not chosen fresh this mission**: Capacitor (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios` are dependencies; `android/` and `ios/` platform folders and `capacitor.config.json` already exist). `capacitor.config.json` is configured in **remote-URL mode** — the native shell loads `https://menorah-bible-quiz.vercel.app` directly in a WebView rather than bundling a static build (`webDir: "www"` is set but unused while `server.url` is present; Capacitor prefers the remote URL). This is the lowest-risk packaging approach: the native app always reflects whatever is live on Vercel, no separate mobile build/release pipeline to keep in sync.

Not done in this mission, and out of scope per the mission's own instructions ("no actual app-store publishing"): opening the project in Xcode/Android Studio, code-signing, store listings, or a `pnpm cap sync` step wired into any script. `android/` and `ios/` were left untouched to avoid destabilizing an existing, working setup neither verified nor modified here.

## Required checks before every deploy

```bash
pnpm install
pnpm run build
pnpm run lint
node tests/regression.mjs   # requires a running `pnpm run start`/`pnpm run dev` and QUESTION_ADMIN_SECRET in .env.local
```

See [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for the full pre-launch checklist.
