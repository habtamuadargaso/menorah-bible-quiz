# Admin Setup

Covers: provisioning a real admin account, applying the Mission 7 admin migrations, and migrating existing local review data to Supabase. See [SECURITY.md](SECURITY.md) for the security model behind all of this.

## 1. Apply the migrations

In the Supabase SQL Editor, run (in order, if not already applied):

```
supabase/migrations/20260723_mission7_admin_platform.sql
supabase/migrations/20260724_mission7_data_retention.sql
```

Both are idempotent (`create table if not exists`, `create or replace function`, `drop policy if exists` before every `create policy`) — safe to re-run.

**Until this is done**, the admin dashboard's data-backed tabs (Dashboard, Review Queue, Translation Center, Import/Export, Settings) will return a 500 with a "table not found" error. The AI Question Factory tab still works either way (it writes straight to the pre-existing `questions`/`question_translations` tables, untouched by this migration).

## 2. Provision your first admin account

There is no self-service admin signup — by design (CLAUDE.md: "Never trust a role sent from the browser").

1. Supabase Dashboard -> Authentication -> Users -> Add User. Give it a real email and a password.
2. Copy that user's UUID.
3. In the Supabase SQL Editor:
   ```sql
   insert into public.admin_users (user_id, email)
   values ('<uuid from step 2>', '<their email>');
   ```
4. Go to `/admin/questions` and sign in with that email/password.

To add more admins later, repeat steps 1–3 (an existing admin can look up new users' UUIDs in the Supabase dashboard — there's no in-app "invite admin" flow yet).

**Known interaction**: signing in as an admin uses the same browser-side Supabase client as anonymous player sessions. If you test both gameplay and the admin dashboard in the same browser profile, admin sign-in replaces your anonymous player session for that tab. Use a separate browser profile (or incognito) if you need both at once.

## 3. Local-development fallback (no admin account yet)

If you haven't provisioned an admin account, `/admin/questions` shows a collapsed "Local development fallback" section: enter `QUESTION_ADMIN_SECRET` (from `.env.local`) instead. This grants access to anyone with the secret, not per-user — see [SECURITY.md](SECURITY.md#admin-authentication-mission-7-part-3). Don't rely on this once real admin accounts exist; it exists only so the dashboard remains usable before the first admin is provisioned.

## 4. Migrate existing local review data (if any)

If you'd previously used the admin dashboard and have data under `data/admin/*.json` (review decisions, imported questions, settings), migrate it into Supabase:

```bash
node scripts/migrate-admin-json-to-supabase.mjs
```

Idempotent (upserts keyed by question ID) — safe to re-run. It does **not** delete the local JSON files (CLAUDE.md: "Do not delete local development data until migration is verified"). Verify the data landed correctly in the Supabase tables, then remove `data/admin/*.json` yourself once you're satisfied.

## 5. Cleaning up stale rooms

`POST /api/admin/cleanup` (admin-gated) removes abandoned Live Battle rooms that were created but never started, older than 2 hours. Defaults to a dry run:

```bash
curl -X POST https://your-domain/api/admin/cleanup \
  -H "x-admin-secret: $QUESTION_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
# {"dryRun":true,"wouldDeleteCount":3,...}

curl -X POST https://your-domain/api/admin/cleanup \
  -H "x-admin-secret: $QUESTION_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"confirm": true}'
# {"dryRun":false,"deletedCount":3,...}
```

Never touches an in-progress game or a finished room's leaderboard history — see [SECURITY.md](SECURITY.md#data-retention-mission-7-part-13) for why. Not scheduled automatically; wire it to a Vercel Cron job or Supabase `pg_cron` if you want it to run periodically, or trigger it manually from the admin dashboard.

## Question review workflow

See [QUESTION_PUBLISHING.md](QUESTION_PUBLISHING.md) for the Draft -> Needs Review -> Approved -> Published -> Archived workflow and what each status actually gates today.
