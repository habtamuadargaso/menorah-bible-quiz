-- Mission 7 — admin permission hotfix.
--
-- Root cause: 20260723_mission7_admin_platform.sql created admin_users,
-- question_review_overlay, question_review_history, admin_imported_questions,
-- and admin_settings with RLS enabled and correct policies, but never
-- granted any Postgres table privilege to `authenticated` or `service_role`
-- on the four new tables. RLS policies only filter which *rows* a role can
-- see once it already has table access — the GRANT is a separate, earlier
-- gate, and without it every query fails with "permission denied for table
-- X" before RLS is ever evaluated. Compare 20260711_final_multiplayer.sql,
-- which explicitly grants privileges on every table it creates; Mission 7
-- simply missed this step. admin_users was already patched by hand (its
-- `authenticated` SELECT works), which is why only the other four surfaced
-- the error.
--
-- Important nuance this migration deliberately respects: `service_role`
-- bypasses RLS entirely in Postgres/Supabase (BYPASSRLS), but a GRANT is
-- independent of RLS — bypassing RLS does not bypass or require a GRANT.
-- question_review_history is an append-only audit trail (no UPDATE/DELETE
-- policy exists for it, by design — see 20260723). If we granted
-- service_role UPDATE/DELETE here, RLS would not stop it from editing
-- history, silently defeating that guarantee. So service_role (and
-- authenticated) get SELECT/INSERT only on that table — matching exactly
-- what application code does and what the existing RLS policies allow.
--
-- Every other table's grants are scoped to what lib/admin/reviewStore.ts
-- and lib/admin/session.ts actually do (select / upsert = insert+update),
-- not a blanket ALL — RLS already restricts access to admin_users members
-- for the `authenticated` role, and service_role is only reachable from
-- trusted server code gated by isAuthorizedAdmin() (see lib/admin/auth.ts).
-- `anon` gets an explicit revoke on all five tables so there is no
-- ambiguity about browser/unauthenticated access, now or if project-level
-- default privileges ever change.
--
-- Idempotent: safe to run more than once.

-- ---------------------------------------------------------------------------
-- admin_users
-- ---------------------------------------------------------------------------
alter table public.admin_users enable row level security;

revoke all on public.admin_users from anon;
grant select on public.admin_users to authenticated;
grant select on public.admin_users to service_role;

drop policy if exists "Admins can read own admin row" on public.admin_users;
create policy "Admins can read own admin row" on public.admin_users
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- question_review_overlay
-- ---------------------------------------------------------------------------
alter table public.question_review_overlay enable row level security;

revoke all on public.question_review_overlay from anon;
grant select, insert, update, delete on public.question_review_overlay to authenticated;
grant select, insert, update on public.question_review_overlay to service_role;

drop policy if exists "Admins can read overlays" on public.question_review_overlay;
create policy "Admins can read overlays" on public.question_review_overlay
  for select using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

drop policy if exists "Admins can write overlays" on public.question_review_overlay;
create policy "Admins can write overlays" on public.question_review_overlay
  for all using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- question_review_history — append-only; no UPDATE/DELETE grant to any
-- role, matching the "no update/delete policy" design in 20260723.
-- ---------------------------------------------------------------------------
alter table public.question_review_history enable row level security;

revoke all on public.question_review_history from anon;
grant select, insert on public.question_review_history to authenticated;
grant select, insert on public.question_review_history to service_role;

drop policy if exists "Admins can read history" on public.question_review_history;
create policy "Admins can read history" on public.question_review_history
  for select using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

drop policy if exists "Admins can insert history" on public.question_review_history;
create policy "Admins can insert history" on public.question_review_history
  for insert with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- admin_imported_questions
-- ---------------------------------------------------------------------------
alter table public.admin_imported_questions enable row level security;

revoke all on public.admin_imported_questions from anon;
grant select, insert, update, delete on public.admin_imported_questions to authenticated;
grant select, insert, update on public.admin_imported_questions to service_role;

drop policy if exists "Admins can read imported questions" on public.admin_imported_questions;
create policy "Admins can read imported questions" on public.admin_imported_questions
  for select using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

drop policy if exists "Admins can write imported questions" on public.admin_imported_questions;
create policy "Admins can write imported questions" on public.admin_imported_questions
  for all using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- admin_settings
-- ---------------------------------------------------------------------------
alter table public.admin_settings enable row level security;

revoke all on public.admin_settings from anon;
grant select, insert, update, delete on public.admin_settings to authenticated;
grant select, insert, update on public.admin_settings to service_role;

drop policy if exists "Admins can read settings" on public.admin_settings;
create policy "Admins can read settings" on public.admin_settings
  for select using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

drop policy if exists "Admins can write settings" on public.admin_settings;
create policy "Admins can write settings" on public.admin_settings
  for all using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));
