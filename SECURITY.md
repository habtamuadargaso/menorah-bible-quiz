# Security

Mission 7 release-prep documentation. This describes what the codebase
actually does today, verified against the source — not aspirational
claims. Update this file whenever the security posture changes.

## Secrets

| Variable | Exposure | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe | Public by design |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe | RLS-scoped, public by design |
| `NEXT_PUBLIC_SITE_URL` | Browser-safe | Used for absolute metadata URLs |
| `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` | **Server-only** | Bypasses RLS. Used in `lib/question-factory/database.ts` (AI Factory writes) and `lib/supabase/server.ts`'s `createServiceRoleClient()` (admin data persistence). Never sent to the browser, never logged. |
| `GEMINI_API_KEY` | **Server-only** | AI Question Factory only |
| `QUESTION_ADMIN_SECRET` | **Server-only** | Local-dev admin fallback — see [ADMIN.md](ADMIN.md) |

Verified: `git grep` finds no committed secret literals (see the CI secret-scan step in `.github/workflows/ci.yml`), `.env.local` is gitignored, and no server-only variable is ever referenced in a `"use client"` file or in a `NextResponse.json()` body.

## Admin authentication (Mission 7 Part 3)

Two paths, checked in order by `lib/admin/auth.ts`'s `isAuthorizedAdmin()`:

1. **Real per-user auth** — a live Supabase Auth session whose user is listed in the `admin_users` table (`lib/admin/session.ts`). This is the production path. `admin_users` has no insert/update/delete RLS policy for regular clients — granting admin access is a SQL-Editor-only action (CLAUDE.md: "Never trust a role sent from the browser").
2. **Shared-secret fallback** (`x-admin-secret` header vs `QUESTION_ADMIN_SECRET`) — the original Mission 5E mechanism, kept only as a documented local-development convenience. Grants access to anyone with the secret, not per-user. Do not set this env var in production once real admin accounts exist.

Every `/api/admin/*` route and the `/admin/questions` page checks this before doing anything. See [ADMIN.md](ADMIN.md) for how to provision an admin account.

## Database security review (Mission 7 Part 5)

All tables have Row Level Security **enabled** (`supabase/migrations/*.sql`, `alter table ... enable row level security`) — verified across all 5 migration files, 8 original tables plus 5 added in this mission, 26+ `create policy` statements total. Nothing was found running with RLS disabled.

Key points from the review:

- **Live Battle tables** (`rooms`, `room_players`, `room_questions`, `answers`): correctness-critical RPCs (`submit_answer`, `resolve_round`, `advance_phase`, `get_room_question`, `get_reveal_answers`, etc.) are all `security definer` with `set search_path = public` explicitly set — the standard defense against search-path hijacking in `security definer` functions. Verified every `security definer` function in the codebase sets it; none omit it.
- **Answer-key protection**: `questions.correct_index` / `question_translations.explanation` are not directly selectable by clients — `get_question_answer_keys()` (solo play) and the reveal-phase RPCs gate when a player can see a correct answer, preventing the "peek the answer before answering" class of bug this project fixed earlier (see git history, commit `d75ebd5`).
- **Admin tables** (`admin_users`, `question_review_overlay`, `question_review_history`, `admin_imported_questions`, `admin_settings`, added this mission): RLS-protected via `exists (select 1 from admin_users where user_id = auth.uid())` policies. In practice, the app's own server code (`lib/admin/reviewStore.ts`) uses the **service-role client** (bypasses RLS) because authorization is already enforced at the API-route layer (`isAuthorizedAdmin()`) before these functions are ever called — RLS here is defense-in-depth against direct anon-key access, not the primary gate.
- **Anonymous auth**: players get a Supabase anonymous session (`supabase.auth.signInAnonymously()`), no email/password collected to play.
- **Gap found and deliberately left alone**: `data/admin/` JSON persistence (pre-Mission-7) had no access control beyond the Node process's filesystem permissions — anyone with server access could read/write it directly. Migrating this to RLS-protected Supabase tables (this mission's Part 4) closes that gap; see the migration note below for why the local JSON files are not yet deleted.
- **Critical finding, fixed this mission**: `lib/question-factory/database.ts` wrote every AI-generated question with `status: "published"` — meaning newly generated content reached real players immediately, with zero human review. This directly violated CLAUDE.md's non-negotiable rule 6 ("Do not publish AI-generated Bible content automatically"). Fixed by writing `status: "draft"` and adding a required review step (`/api/admin/factory-review`, surfaced as "Pending AI Review" in the AI Factory admin tab) — see [QUESTION_PUBLISHING.md](QUESTION_PUBLISHING.md).

### Required manual step

`supabase/migrations/20260723_mission7_admin_platform.sql` and `supabase/migrations/20260724_mission7_data_retention.sql` must be run in the Supabase SQL Editor before the admin dashboard's data-backed tabs (or `/api/admin/cleanup`) will work — same manual-application convention as every prior migration in this project (see the root `CLAUDE.md`). Until then, `/api/admin/*` routes that touch review/import/settings data return a 500 with a clear "table not found" error (verified — never a crash, never a leaked secret). See [ADMIN.md](ADMIN.md) for the full migration + provisioning steps.

## Security headers (Mission 7 Part 9)

Set in `next.config.mjs`'s `headers()`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/microphone/geolocation/payment all denied), `Strict-Transport-Security`, and a `Content-Security-Policy`.

**CSP tradeoff, tested not assumed**: `script-src 'self' 'unsafe-inline'`. A per-request nonce-based CSP was built and tested against every route first (home, solo play, Friends Battle, Live Battle setup/host/play, admin dashboard, settings) — it broke every statically-prerendered route, because a nonce can only be baked into HTML rendered per-request, and most routes here are intentionally static (Mission 6 Part 8's code-splitting/perf work). Forcing all routes to dynamic rendering just to drop `'unsafe-inline'` was rejected as a worse tradeoff. What the CSP still blocks: any script from a non-`'self'` origin, framing this site at all, and any network connection other than to this origin and this project's own Supabase instance (`connect-src` is scoped to the actual `NEXT_PUBLIC_SUPABASE_URL` host, not a wildcard). Do not tighten `script-src` further without re-running the same route sweep — see `RELEASE_CHECKLIST.md`.

`/admin/*`, `/api/admin/*`, and `/multiplayer/host|play/*` additionally get `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store`.

## Rate limiting (Mission 7 Part 10)

`lib/rateLimit.ts` — an in-memory sliding-window limiter, applied to every `/api/admin/*` route (120 req/min general, 20/min for `/api/admin/cleanup`) and `/api/questions/generate` (5 req/10min, since it calls a paid external API and writes to Supabase).

**Honest limitation**: this is single-instance in-memory state. On serverless (Vercel), a burst spread across multiple warm instances — or any cold start — resets the count. It's a best-effort backstop against accidental hammering (retry loops, casual abuse), not a hard guarantee against a determined attacker. A real guarantee needs a shared store (e.g. Upstash Redis).

**What is explicitly NOT rate-limited, and why**: room creation, room joining, and answer submission in Live Battle never pass through a Next.js API route — the browser calls Supabase directly (`lib/liveBattleRoom.ts`), protected by RLS instead. No Next.js-layer rate limiter can cover them. If abuse there becomes a real problem, the fix has to live on the Supabase side: either a `security definer` function that checks recent-row counts before inserting, or Supabase's own configurable Auth rate limits (anonymous sign-in rate, in the Supabase dashboard).

## Data retention (Mission 7 Part 13)

`cleanup_stale_rooms()` (`supabase/migrations/20260724_mission7_data_retention.sql`), triggered via `/api/admin/cleanup` (admin-gated, rate-limited, dry-run by default — requires an explicit `{"confirm": true}` body to actually delete).

Scope is deliberately narrow: **only** abandoned `'waiting'` rooms older than 2 hours (created, never started). `'playing'`/`'revealing'` rooms (an active game) are never touched. **`'finished'` rooms are also never touched by this function** — `get_leaderboard()`'s all-time win-streak and total-battle-win calculations query `rooms`/`room_players` directly for `status = 'finished'` with no separate aggregate table, so deleting old finished rooms would silently corrupt every player's all-time leaderboard stats. Real finished-room retention needs a rollup-into-`profiles` step first; that's a real schema change, out of scope here, and documented rather than silently built around.

## Backup and recovery (Mission 7 Part 14)

Being precise about what is and isn't actually configured, per CLAUDE.md: "Do not claim backups exist unless they are actually configured or tested."

- **What's real today**: Supabase's platform-level automated backups/PITR, if enabled on your project's plan (Settings -> Database -> Backups in the Supabase dashboard). This is **not verified as enabled** by this mission — check it yourself; it depends on your Supabase plan tier and is not something this codebase configures.
- **What this codebase provides**: the admin dashboard's Export panel (`/api/admin/export`, Mission 5E) produces a JSON snapshot of the canonical question bank on demand — a manual, tested, working export path, but only for question content, not for Live Battle/profile data.
- **What is NOT configured**: no automated `pg_dump` schedule, no off-Supabase backup destination, no tested restore drill. If you need a real recovery guarantee, set up Supabase's PITR (if your plan supports it) or a scheduled `pg_dump` to external storage, and **test an actual restore** before relying on it — an untested backup is not a backup.

## Reporting a vulnerability

No security contact is currently configured in this repository — add one (e.g. a `security@` address or a private disclosure form) before public launch.
