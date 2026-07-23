-- Mission 7 — Release Preparation: real admin authentication + Supabase-
-- backed admin persistence (replaces data/admin/*.json, which does not
-- survive on a serverless deployment target).
--
-- Idempotent: every statement uses IF NOT EXISTS / OR REPLACE, so running
-- this twice against the same database is safe.
--
-- After running this once in the Supabase SQL Editor, provision your first
-- admin account (see ADMIN.md):
--   1. Supabase Dashboard -> Authentication -> Add User (email + password).
--   2. In the SQL Editor, run:
--        insert into public.admin_users (user_id, email)
--        values ('<uuid from step 1>', '<their email>');

-- ---------------------------------------------------------------------------
-- admin_users: who is allowed into /admin/questions and /api/admin/*.
-- Deliberately has NO insert/update/delete policy for regular clients —
-- granting admin access is a service-role-only / SQL-Editor-only action,
-- never something reachable from the browser. See CLAUDE.md: "Never trust
-- a role sent from the browser."
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'admin' check (role in ('admin', 'superadmin')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

alter table public.admin_users enable row level security;

drop policy if exists "Admins can read own admin row" on public.admin_users;
create policy "Admins can read own admin row" on public.admin_users
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- question_review_overlay: replaces data/admin/review-state.json. Keyed by
-- the canonical question id (lib/questions/types.ts BibleQuestion.id).
-- ---------------------------------------------------------------------------
create table if not exists public.question_review_overlay (
  question_id text primary key,
  status text not null default 'draft'
    check (status in ('draft', 'needs-review', 'approved', 'published', 'rejected', 'archived')),
  reviewer text,
  reviewed_at timestamptz,
  reason text,
  edits jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.question_review_overlay enable row level security;

drop policy if exists "Admins can read overlays" on public.question_review_overlay;
create policy "Admins can read overlays" on public.question_review_overlay
  for select using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

drop policy if exists "Admins can write overlays" on public.question_review_overlay;
create policy "Admins can write overlays" on public.question_review_overlay
  for all using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- question_review_history: append-only audit trail. No update/delete
-- policy at all, by design — history must not be editable after the fact.
-- ---------------------------------------------------------------------------
create table if not exists public.question_review_history (
  id uuid primary key default gen_random_uuid(),
  question_id text not null,
  at timestamptz not null default now(),
  reviewer text,
  action text not null,
  detail text
);

create index if not exists question_review_history_question_id_idx
  on public.question_review_history (question_id);

alter table public.question_review_history enable row level security;

drop policy if exists "Admins can read history" on public.question_review_history;
create policy "Admins can read history" on public.question_review_history
  for select using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

drop policy if exists "Admins can insert history" on public.question_review_history;
create policy "Admins can insert history" on public.question_review_history
  for insert with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- admin_imported_questions: replaces data/admin/imported-questions.json.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_imported_questions (
  id uuid primary key default gen_random_uuid(),
  question_id text not null unique,
  payload jsonb not null,
  imported_at timestamptz not null default now(),
  imported_by text
);

alter table public.admin_imported_questions enable row level security;

drop policy if exists "Admins can read imported questions" on public.admin_imported_questions;
create policy "Admins can read imported questions" on public.admin_imported_questions
  for select using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

drop policy if exists "Admins can write imported questions" on public.admin_imported_questions;
create policy "Admins can write imported questions" on public.admin_imported_questions
  for all using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- admin_settings: replaces data/admin/settings.json. Single row (id = 1).
-- ---------------------------------------------------------------------------
create table if not exists public.admin_settings (
  id int primary key default 1 check (id = 1),
  settings jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.admin_settings enable row level security;

drop policy if exists "Admins can read settings" on public.admin_settings;
create policy "Admins can read settings" on public.admin_settings
  for select using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

drop policy if exists "Admins can write settings" on public.admin_settings;
create policy "Admins can write settings" on public.admin_settings
  for all using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));
