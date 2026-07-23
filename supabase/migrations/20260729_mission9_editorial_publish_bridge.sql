-- Mission 9 — Editorial-to-live publishing bridge.
--
-- Unifies the two previously-disconnected content pipelines documented in
-- WORK_LOG.md ("Mission 8 — Admin Platform improvements"):
--   Pipeline A (live gameplay):  public.questions / public.question_translations
--   Pipeline B (editorial review): canonical bank + admin_imported_questions +
--                                   question_review_overlay/_history
--
-- public.questions remains the ONLY source live gameplay reads from —
-- nothing here changes that, or touches its RLS policies (still
-- authenticated-select-published-only, still no authenticated write
-- policy). This migration only adds a mapping from a live row back to the
-- editorial question it was published from, plus one function that
-- performs that publish atomically.
--
-- Idempotent: every statement uses IF NOT EXISTS / OR REPLACE / a guarded
-- DO block, safe to run more than once.
--
-- ROLLBACK: to fully revert this migration, run (in order):
--   drop function if exists public.publish_editorial_question(text, text, int, text, text, int, text, int, text, jsonb, text, text, text[]);
--   drop index if exists public.questions_source_mapping_idx;
--   alter table public.questions
--     drop column if exists source_question_id,
--     drop column if exists source_type,
--     drop column if exists published_by,
--     drop column if exists source_category,
--     drop column if exists source_tags;
-- This is safe ONLY if no bridge-published rows exist yet (dropping the
-- columns on a table that has bridge-published rows loses their
-- provenance, though the rows themselves — and player-visible content —
-- are untouched; they'd simply look identical to a direct AI-Factory row
-- afterward). Existing AI-Factory-authored rows are never affected by this
-- migration or its rollback either way (every new column is nullable and
-- defaults to NULL for them).

-- ---------------------------------------------------------------------------
-- 1. Source mapping columns on public.questions (nullable — existing rows,
--    all AI-Factory-authored, get NULL, meaning "not from the editorial
--    bridge" — see requirement 9, "nullable defaults for existing records").
-- ---------------------------------------------------------------------------
alter table public.questions
  add column if not exists source_question_id text,
  add column if not exists source_type text,
  add column if not exists published_by text,
  add column if not exists source_category text,
  add column if not exists source_tags text[];

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'questions_source_type_check'
  ) then
    alter table public.questions
      add constraint questions_source_type_check
      check (source_type is null or source_type in ('canonical', 'imported'));
  end if;
end $$;

comment on column public.questions.source_question_id is
  'Editorial question id (BibleQuestion.id — canonical bank or admin_imported_questions) this row was published from via publish_editorial_question(). NULL for rows authored directly by the AI Factory.';
comment on column public.questions.source_type is
  '''canonical'' or ''imported'' — which editorial store source_question_id refers to. NULL for AI-Factory-authored rows.';
comment on column public.questions.published_by is
  'Reviewer name who triggered the editorial-to-live publish (source metadata, requirement 4). NULL for AI-Factory-authored rows (those use questions.rejected_reason / factory-review''s own audit trail instead).';
comment on column public.questions.source_category is
  'BibleQuestion.category (free-form narrative tag, e.g. "Creation") from the editorial source — preserved for fidelity/debugging only; no gameplay code reads this. questions.category itself holds canonicalCategory instead (see source_type mapping design notes in WORK_LOG.md).';
comment on column public.questions.source_tags is
  'BibleQuestion.tags from the editorial source — preserved for fidelity/debugging only; no gameplay code reads this.';

-- Idempotency, enforced at the database level (requirement 3): a given
-- editorial source can map to at most one live row. Partial index so
-- existing/future AI-Factory rows (source_question_id NULL) are entirely
-- excluded from this constraint — NULLs already wouldn't collide under a
-- normal unique index, but a partial index makes that explicit and cheaper.
create unique index if not exists questions_source_mapping_idx
  on public.questions (source_type, source_question_id)
  where source_question_id is not null;

-- ---------------------------------------------------------------------------
-- 2. publish_editorial_question() — the atomic bridge.
--
-- SECURITY DEFINER: runs as the function owner (the migration-running
-- role, which already has full privileges on these tables), so it needs
-- no new table-level grants for whichever role calls it — only EXECUTE on
-- the function itself, granted to service_role below. NOT granted to
-- authenticated: this is reachable only from server-side admin routes,
-- already gated by isAuthorizedAdmin() before this is ever called — never
-- from the browser (requirement 5).
--
-- Re-verifies eligibility (question_review_overlay.status = 'approved')
-- itself, at write time, closing the gap between whenever the calling
-- route last read that status and this actual write — this works
-- identically for canonical- and imported-sourced questions, since
-- question_review_overlay is a plain Postgres table keyed by a free-text
-- question_id for either kind (requirement 5's "never trust ... status
-- ... from the browser" extended here to "don't even fully trust the
-- caller's last read of server state").
--
-- Atomicity (requirement 6): inserting into questions, inserting into
-- question_translations, and updating question_review_overlay all happen
-- in this one function invocation. A single top-level call to a plpgsql
-- function is one Postgres transaction — if anything after the first
-- insert fails, the whole thing rolls back, so question_review_overlay
-- can never end up saying "published" while no live row exists.
--
-- Idempotency at the write itself: checks for an existing
-- (source_type, source_question_id) row first and returns 'already_live'
-- as a no-op; the unique index is the actual backstop for the race where
-- two concurrent calls both pass that check (caught via the
-- unique_violation exception handler below, not treated as a hard error).
-- ---------------------------------------------------------------------------
create or replace function public.publish_editorial_question(
  p_source_type text,
  p_source_question_id text,
  p_level int,
  p_category text,
  p_book text,
  p_chapter int,
  p_difficulty text,
  p_correct_index int,
  p_reference text,
  p_translations jsonb,
  p_reviewer text,
  p_source_category text default null,
  p_source_tags text[] default null
)
returns table(outcome text, live_question_id text)
security definer
set search_path = public
language plpgsql
as $$
declare
  v_existing_id text;
  v_overlay_status text;
  v_new_id text;
begin
  if p_source_type not in ('canonical', 'imported') then
    raise exception 'publish_editorial_question: invalid source_type %', p_source_type;
  end if;
  if p_source_question_id is null or length(trim(p_source_question_id)) = 0 then
    raise exception 'publish_editorial_question: source_question_id is required';
  end if;
  if p_translations is null or jsonb_array_length(p_translations) = 0 then
    raise exception 'publish_editorial_question: at least one translation is required';
  end if;

  -- Idempotency check (fast path — the unique index below is the actual
  -- guarantee against a concurrent double-insert).
  select id into v_existing_id
  from public.questions
  where source_type = p_source_type and source_question_id = p_source_question_id;

  if v_existing_id is not null then
    return query select 'already_live'::text, v_existing_id;
    return;
  end if;

  -- Re-check eligibility at write time, not just at the caller's last read.
  select status into v_overlay_status
  from public.question_review_overlay
  where question_id = p_source_question_id;

  if v_overlay_status is distinct from 'approved' then
    return query select 'ineligible'::text, null::text;
    return;
  end if;

  v_new_id := 'EDITORIAL-' || p_source_question_id;

  insert into public.questions (
    id, level, category, book, chapter, difficulty, correct_index, reference,
    status, source_question_id, source_type, published_by, source_category, source_tags
  ) values (
    v_new_id, p_level, p_category, p_book, p_chapter, p_difficulty, p_correct_index, p_reference,
    'published', p_source_question_id, p_source_type, p_reviewer, p_source_category, p_source_tags
  );

  insert into public.question_translations (
    question_id, language_code, question_text, choice_1, choice_2, choice_3, choice_4, explanation, reflection
  )
  select
    v_new_id,
    t ->> 'language_code',
    t ->> 'question_text',
    t ->> 'choice_1',
    t ->> 'choice_2',
    t ->> 'choice_3',
    t ->> 'choice_4',
    t ->> 'explanation',
    t ->> 'reflection'
  from jsonb_array_elements(p_translations) as t;

  update public.question_review_overlay
  set status = 'published', reviewer = p_reviewer, reviewed_at = now(), updated_at = now()
  where question_id = p_source_question_id;

  return query select 'published'::text, v_new_id;
exception
  when unique_violation then
    -- Concurrent publish race: another call won between our check and our
    -- insert. Report it the same as if we'd seen it up front, rather than
    -- surfacing a raw constraint error to the admin.
    select id into v_existing_id from public.questions
    where source_type = p_source_type and source_question_id = p_source_question_id;
    return query select 'already_live'::text, v_existing_id;
end;
$$;

revoke all on function public.publish_editorial_question(
  text, text, int, text, text, int, text, int, text, jsonb, text, text, text[]
) from public;
grant execute on function public.publish_editorial_question(
  text, text, int, text, text, int, text, int, text, jsonb, text, text, text[]
) to service_role;
