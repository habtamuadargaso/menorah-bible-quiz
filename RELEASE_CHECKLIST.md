# Release Checklist (Mission 7 Part 20)

Status as of this mission's completion. Re-check the "Required" section on every release.

## Required (blocks launch)

- [x] `pnpm run build` passes (typecheck + build)
- [x] `pnpm run lint` passes with zero warnings
- [x] `node tests/regression.mjs` passes locally against a running server with `QUESTION_ADMIN_SECRET` set — **must be re-run after `supabase/migrations/20260723_mission7_admin_platform.sql` and `20260724_mission7_data_retention.sql` are applied to the target Supabase project** (see below; the admin suite fails with a clean 500 until then, by design)
- [ ] `supabase/migrations/20260723_mission7_admin_platform.sql` applied to the production Supabase project (SQL Editor)
- [ ] `supabase/migrations/20260724_mission7_data_retention.sql` applied to the production Supabase project (SQL Editor)
- [ ] At least one real admin account provisioned (`admin_users` row) — see [ADMIN.md](ADMIN.md)
- [ ] `QUESTION_ADMIN_SECRET` either unset in Production, or accepted as a deliberate temporary fallback until the admin account above is provisioned
- [ ] `NEXT_PUBLIC_SITE_URL` set to the real production domain (affects OG/social metadata + `robots.txt`/`sitemap.xml`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`) set in Production — required for the admin dashboard and AI Factory to function at all
- [ ] A real support contact wired into `/support` (currently a placeholder — see `app/support/page.tsx`)
- [ ] `/privacy` and `/terms` reviewed by a lawyer before being treated as binding (currently explicitly labeled draft — CLAUDE.md)
- [ ] CI repository secrets configured (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `QUESTION_ADMIN_SECRET`) — see `.github/workflows/ci.yml`

## Recommended (do soon after launch)

- [ ] PNG app icons (192x192, 512x512, maskable) — see [DEPLOYMENT.md](DEPLOYMENT.md#pwa--installability-mission-7-part-17)
- [ ] Verify Supabase's platform-level backup/PITR is actually enabled for your plan tier — this codebase does not configure or verify it (see [SECURITY.md](SECURITY.md#backup-and-recovery-mission-7-part-14))
- [ ] Wire `/api/admin/cleanup` to a scheduled trigger (Vercel Cron or Supabase `pg_cron`) instead of manual admin-triggered calls
- [ ] Move rate limiting to a shared store (e.g. Upstash Redis) if traffic grows enough that single-instance in-memory limiting stops being a meaningful backstop
- [ ] Add a real error-reporting provider (Sentry or similar) — `lib/errorReporting.ts` is a documented no-op adapter, ready to wire up
- [ ] Add a real analytics provider if desired — `lib/analytics.ts` is a documented no-op adapter, off by default
- [ ] Decide on the Supabase `questions` table's translation-completeness / Store #2 audit trail gap noted in [QUESTION_PUBLISHING.md](QUESTION_PUBLISHING.md#known-gaps-honest-not-fixed-this-mission)

## Future (tracked, not urgent)

- [ ] Unify the three question content stores into one source of truth — see [QUESTION_PUBLISHING.md](QUESTION_PUBLISHING.md#recommended-path-to-a-single-source-of-truth)
- [ ] Service worker for full offline page-shell support (not needed for current gameplay requirements — see DEPLOYMENT.md)
- [ ] Actual app-store packaging (code signing, store listings) if native distribution is wanted beyond the current Capacitor remote-URL wrapper

## CSP route sweep (re-run before tightening `script-src` further)

Verified zero CSP console violations on, using a headless-Chrome Playwright pass against a production build (`pnpm run build && pnpm run start`):

- `/` (home)
- `/friends-battle`
- `/multiplayer`
- `/multiplayer/join`
- `/settings`
- `/leaderboard`
- `/admin/questions`

Not separately swept (same code paths as the above, lower risk): `/about`, `/privacy`, `/terms`, `/support`, `/multiplayer/host/[code]`, `/multiplayer/play/[code]`. Re-run the full sweep (see `SECURITY.md`) whenever `next.config.mjs`'s CSP changes or a new top-level route is added.

## 20 production-critical scenarios (Mission 7 Part 22)

See the final mission report for pass/fail status of each. Re-verify this list before every major release.
