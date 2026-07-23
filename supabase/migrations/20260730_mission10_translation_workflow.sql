-- Mission 10 — Global translation workflow for public.question_translations.
--
-- public.questions remains the sole live-gameplay question identity
-- (unchanged by this migration). public.question_translations remains the
-- actual per-language content gameplay reads (also unchanged in shape —
-- this migration only ADDS workflow metadata columns to it). Nothing here
-- touches the editorial canonical/admin_imported_questions/
-- question_review_overlay pipeline (Missions 7-9) — that system stays
-- English/Amharic-only by design; Mission 10's multi-language workflow
-- operates entirely downstream of it, directly against the live table.
--
-- Idempotent: every statement uses IF NOT EXISTS / OR REPLACE / a guarded
-- DO block / a WHERE-scoped UPDATE, safe to run more than once.
--
-- ROLLBACK: to fully revert this migration, run (in order):
--   -- restore the original get_room_question (no translation_available
--   -- column, English-coalesce fallback) by re-running the CREATE
--   -- FUNCTION block from supabase/migrations/20260719_online_live_battle.sql
--   -- (search for "create or replace function public.get_room_question").
--   drop table if exists public.translation_review_history;
--   drop index if exists public.question_translations_lang_status_idx;
--   drop index if exists public.questions_status_idx;
--   alter table public.question_translations
--     drop constraint if exists question_translations_status_check,
--     drop column if exists status,
--     drop column if exists source_language,
--     drop column if exists translation_provider,
--     drop column if exists ai_model,
--     drop column if exists generated_at,
--     drop column if exists reviewed_by,
--     drop column if exists reviewed_at,
--     drop column if exists rejection_reason,
--     drop column if exists quality_score,
--     drop column if exists published_at;
--   -- then re-run the ORIGINAL (looser) RLS policy from
--   -- 20260711_final_multiplayer.sql if you need the pre-Mission-10 policy back.
-- This is safe at any time — dropping the columns loses workflow history
-- and re-opens the "any row = playable" behavior (restoring exactly the
-- pre-Mission-10 state), but never touches player-visible question
-- content itself, and the append-only translation_review_history is only
-- ever additive so dropping it loses an audit trail, not live data.

-- ---------------------------------------------------------------------------
-- 1. Workflow columns on public.question_translations (additive, nullable
--    except `status`, which gets a safe backfill below before being made
--    NOT NULL — never a blind default applied to existing rows).
-- ---------------------------------------------------------------------------
alter table public.question_translations
  add column if not exists status text,
  add column if not exists source_language text,
  add column if not exists translation_provider text,
  add column if not exists ai_model text,
  add column if not exists generated_at timestamptz,
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists quality_score numeric,
  add column if not exists published_at timestamptz;

-- Safe backfill (requirement: backfill safe status values, not a blind
-- default) — only touches rows this migration hasn't already visited
-- (status is still null), so re-running is a no-op the second time.
-- Derives each existing translation's workflow status from its PARENT
-- question's status, since that parent status was, until this migration,
-- the only review gate that existed for this content at all — this
-- preserves every currently-playable translation's playability exactly
-- (parent 'published' -> translation 'published') while giving
-- non-published rows a status that reflects their real current state
-- rather than an arbitrary default.
update public.question_translations qt
set
  status = case q.status
    when 'published' then 'published'
    when 'approved' then 'approved'
    when 'review' then 'needs_review'
    when 'rejected' then 'rejected'
    else 'ai_draft'
  end,
  source_language = case when qt.language_code <> 'en' then 'en' else qt.source_language end,
  published_at = case when q.status = 'published' then coalesce(qt.published_at, qt.created_at) else qt.published_at end
from public.questions q
where q.id = qt.question_id
  and qt.status is null;

-- Any orphaned translation row whose parent somehow no longer exists
-- (shouldn't happen given the FK's `on delete cascade`, but the backfill
-- above only sets status via the join — this catches the impossible case
-- defensively rather than leaving a NULL that the NOT NULL below would
-- reject).
update public.question_translations
set status = 'ai_draft'
where status is null;

alter table public.question_translations alter column status set default 'ai_draft';
alter table public.question_translations alter column status set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'question_translations_status_check') then
    alter table public.question_translations
      add constraint question_translations_status_check
      check (status in ('ai_draft', 'needs_review', 'approved', 'published', 'rejected', 'archived'));
  end if;
end $$;

comment on column public.question_translations.status is
  'Mission 10 translation workflow: ai_draft -> needs_review -> approved -> published, or rejected/archived. Only ''published'' rows (with a published parent question) are ever readable by the authenticated role — see the strengthened SELECT policy below.';
comment on column public.question_translations.source_language is 'Language this translation was generated FROM (English by default). NULL for original-language rows never generated by translation (e.g. an AI-Factory-authored English row).';
comment on column public.question_translations.translation_provider is 'e.g. ''gemini''. NULL for rows never produced by the translation pipeline.';
comment on column public.question_translations.ai_model is 'e.g. ''gemini-3.1-flash-lite''. NULL for non-AI-generated rows.';
comment on column public.question_translations.quality_score is 'Only ever populated if the AI provider actually returns a confidence/quality signal — never fabricated. NULL is the expected, normal value.';

-- ---------------------------------------------------------------------------
-- 2. Indexes.
-- ---------------------------------------------------------------------------
create index if not exists question_translations_lang_status_idx
  on public.question_translations (language_code, status);

create index if not exists questions_status_idx
  on public.questions (status);

-- ---------------------------------------------------------------------------
-- 3. Strengthened RLS: a translation is now only readable by `authenticated`
--    when BOTH its own status AND its parent question's status are
--    'published' — closing the gap where, before this migration, any row
--    tied to a published question was readable regardless of whether it
--    was ever reviewed (an ai_draft could already have been read by a raw
--    PostgREST call, even though the app's own queries never surfaced it).
-- ---------------------------------------------------------------------------
drop policy if exists "Players can read published translations" on public.question_translations;
create policy "Players can read published translations" on public.question_translations
for select to authenticated using (
  status = 'published'
  and exists (
    select 1 from public.questions q
    where q.id = question_translations.question_id and q.status = 'published'
  )
);

-- service_role already performs INSERT (AI Factory, existing) and SELECT
-- (factory-review, existing) on this table without an explicit grant —
-- evidence it already has implicit full privileges here (this table
-- predates the point where this project's default privileges stopped
-- propagating automatically — see 20260725_mission7_admin_grants_hotfix.sql's
-- notes on the same pattern). Mission 10 adds UPDATE (approve/reject/edit/
-- publish/archive/regenerate all update existing rows) — defensive,
-- explicit, idempotent insurance rather than proven-necessary.
grant select, insert, update on public.question_translations to service_role;

-- ---------------------------------------------------------------------------
-- 4. translation_review_history — append-only audit trail, same proven
--    shape as question_review_history (Mission 7): no update/delete grant
--    or policy for any role, ever.
-- ---------------------------------------------------------------------------
create table if not exists public.translation_review_history (
  id uuid primary key default gen_random_uuid(),
  question_id text not null,
  language_code text not null,
  action text not null,
  actor text,
  at timestamptz not null default now(),
  detail jsonb
);

create index if not exists translation_review_history_lookup_idx
  on public.translation_review_history (question_id, language_code);

alter table public.translation_review_history enable row level security;

drop policy if exists "Admins can read translation history" on public.translation_review_history;
create policy "Admins can read translation history" on public.translation_review_history
  for select using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

drop policy if exists "Admins can insert translation history" on public.translation_review_history;
create policy "Admins can insert translation history" on public.translation_review_history
  for insert with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

grant select, insert on public.translation_review_history to authenticated;
grant select, insert on public.translation_review_history to service_role;

-- ---------------------------------------------------------------------------
-- 5. get_room_question(): remove the silent English-coalesce fallback.
--
-- Changing a `returns table(...)` function's output columns requires DROP
-- + CREATE (CREATE OR REPLACE cannot change a function's return shape) —
-- this is the one place in this migration that isn't a bare "or replace".
-- Dropping and recreating a function also drops its grants, so EXECUTE is
-- re-granted immediately after, exactly as before (authenticated only —
-- this was never reachable from an unauthenticated client and still isn't).
--
-- Before: coalesce(qt.<col>, qt_en.<col>) — silently substituted English
-- text whenever the room's language was missing a translation for the
-- current question.
-- After: joins ONLY the exact requested language, and ONLY a 'published'
-- translation row — no substitution. A new `translation_available`
-- output column tells the caller definitively whether real content came
-- back; `seedRoomQuestions()` (lib/liveBattleRoom.ts) already guarantees
-- every question it seeds has a published translation in the room's
-- language before the room can even start, so translation_available should
-- be true in ordinary operation — this column exists specifically to make
-- the exceptional case (a translation archived/rejected after seeding,
-- mid-battle) loud and detectable instead of a silent English swap.
-- ---------------------------------------------------------------------------
drop function if exists public.get_room_question(uuid, text);

create function public.get_room_question(
  p_room_id uuid,
  p_lang text default 'en'
)
returns table (
  room_question_id uuid,
  question_number int,
  reference text,
  question_text text,
  choice_1 text,
  choice_2 text,
  choice_3 text,
  choice_4 text,
  correct_index int,
  explanation text,
  translation_available boolean
)
security definer
set search_path = public
language sql
stable
as $$
  select
    rq.id as room_question_id,
    rq.question_number,
    q.reference,
    qt.question_text,
    qt.choice_1,
    qt.choice_2,
    qt.choice_3,
    qt.choice_4,
    case when r.status in ('reveal', 'leaderboard', 'finished') then q.correct_index else null end as correct_index,
    case when r.status in ('reveal', 'leaderboard', 'finished') then qt.explanation else null end as explanation,
    (qt.question_id is not null) as translation_available
  from public.rooms r
  join public.room_questions rq on rq.room_id = r.id and rq.question_number = r.current_question
  join public.questions q on q.id = rq.question_id
  left join public.question_translations qt
    on qt.question_id = q.id and qt.language_code = p_lang and qt.status = 'published'
  where r.id = p_room_id
    and exists (select 1 from public.room_players rp where rp.room_id = r.id and rp.player_id = auth.uid());
$$;

revoke all on function public.get_room_question(uuid, text) from public;
grant execute on function public.get_room_question(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. get_translation_stats() — one aggregate query for the Translation
--    Center's dashboard counts, instead of loading full question/
--    translation content into the app just to count it (requirement:
--    "use database queries that will scale reasonably").
-- ---------------------------------------------------------------------------
create or replace function public.get_translation_stats()
returns table (
  language_code text,
  status text,
  count bigint
)
security definer
set search_path = public
language sql
stable
as $$
  select qt.language_code, qt.status, count(*)::bigint
  from public.question_translations qt
  join public.questions q on q.id = qt.question_id
  where q.status = 'published'
  group by qt.language_code, qt.status;
$$;

revoke all on function public.get_translation_stats() from public;
grant execute on function public.get_translation_stats() to service_role;
