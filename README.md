# Menorah Bible Quiz

A multilingual Bible-learning game with solo campaign progression, rewards, an offline pass-and-play local battle mode, and Supabase-powered online live battle rooms.

## Current release

- Next.js 14 + TypeScript + Tailwind CSS + Framer Motion
- 10-level solo campaign with XP, coins, achievements, daily rewards, and a global leaderboard
- Friends Battle — fully offline 2–8 player pass-and-play mode
- Live Battle — real-time online rooms via Supabase (create/join by code, host dashboard, synchronized rounds)
- English gameplay bank: 100+ questions; Amharic native bank: 10+ questions; other languages have UI translations with explicit content-unavailable messaging (never a silent English fallback)
- Supabase anonymous authentication for players; real per-user Supabase Auth for admins
- Admin dashboard at `/admin/questions` — question review workflow, AI Question Factory (with mandatory human review before publish), translation center, validation, import/export, duplicate detection, settings
- PWA manifest and installable app metadata; Capacitor-wrapped native shells for Android/iOS (remote-URL mode)

## Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm run dev
```

Fill `.env.local` — see `.env.example` for the full annotated list (which variables are browser-safe vs. server-only, and which are optional).

Open `http://localhost:3000`.

## Supabase setup

Run these once, in order, in **Supabase → SQL Editor** (all idempotent — safe to re-run):

```text
supabase/migrations/20260711_final_multiplayer.sql
supabase/migrations/20260718_global_leaderboard.sql
supabase/migrations/20260719_online_live_battle.sql
supabase/migrations/20260722_mission4_fixes.sql
supabase/migrations/20260723_mission7_admin_platform.sql
supabase/migrations/20260724_mission7_data_retention.sql
```

Then provision an admin account — see [ADMIN.md](ADMIN.md).

## Important routes

- `/` — main game (solo campaign)
- `/friends-battle` — offline pass-and-play local battle
- `/multiplayer` — create or join an online Live Battle room
- `/multiplayer/join` — join by code
- `/multiplayer/host/[code]` — host dashboard for a live room
- `/multiplayer/play/[code]` — player view of a live room
- `/leaderboard` — global leaderboard
- `/settings` — language, audio, and accessibility preferences
- `/admin/questions` — admin dashboard (real Supabase Auth, or a documented local-dev shared-secret fallback — see [ADMIN.md](ADMIN.md))

## Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) — environment variables, deployment target, CI, PWA/mobile packaging
- [SECURITY.md](SECURITY.md) — database security review, admin auth, headers/CSP, rate limiting, data retention, backups
- [ADMIN.md](ADMIN.md) — provisioning admin accounts, applying migrations, migrating local review data
- [QUESTION_PUBLISHING.md](QUESTION_PUBLISHING.md) — the three question content stores, what "published" means in each, and the never-auto-publish guarantee
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) — pre-launch checklist

## Production safety notes

- Never commit `.env.local`; server-only secrets (service-role key, Gemini key) are never sent to the browser — see [SECURITY.md](SECURITY.md).
- RLS is enabled on every table, always. Never disable it to solve a permissions problem.
- All AI-generated Bible content requires explicit human approval before it's visible to players (fixed this mission — see [QUESTION_PUBLISHING.md](QUESTION_PUBLISHING.md)).
- The current Live Battle scoring is server-validated via Supabase RPCs (`security definer` functions, not client-trusted); see [SECURITY.md](SECURITY.md#database-security-review-mission-7-part-5) for the full review.
- Use the included music only when you own it or have a commercial-use license.
- `/privacy` and `/terms` are explicitly labeled drafts — not reviewed by a lawyer. Do not treat them as binding until they are.

## Quality checks

```bash
pnpm run build
pnpm run lint
node tests/regression.mjs   # requires a running server + QUESTION_ADMIN_SECRET in .env.local
```

See [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for the full list before shipping a release.
