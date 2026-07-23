-- Mission 11 — fix: publish_editorial_question() never set
-- question_translations.status, so every editorial "Publish" left its
-- translations at the column's default 'ai_draft' even though the parent
-- questions.status was already 'published'.
--
-- Root cause: this function was introduced in
-- 20260729_mission9_editorial_publish_bridge.sql, one migration BEFORE
-- 20260730_mission10_translation_workflow.sql added
-- question_translations.status (default 'ai_draft', required by every
-- gameplay query and the RLS policy for a translation to ever be
-- readable). The function was never revisited after that column arrived,
-- so its `insert into public.question_translations (...)` never mentioned
-- `status` at all — meaning `EDITORIAL-*` questions could be
-- questions.status = 'published' while their translations were
-- permanently invisible to loadQuestionsForLevel/loadQuestionById/
-- get_room_question (all of which require question_translations.status =
-- 'published' too).
--
-- Fix: since publish_editorial_question() only ever runs after a human has
-- already approved the source content via question_review_overlay
-- (re-verified at the top of this function), publishing the live question
-- is itself the human-approval event for its translations too — so they
-- are inserted directly as 'published', with reviewed_by/reviewed_at/
-- published_at populated from the same reviewer/timestamp the parent
-- question uses, and an audit row per language in
-- translation_review_history (added by Mission 10, unused by this
-- function until now).
--
-- Idempotent: CREATE OR REPLACE on an unchanged signature/return shape.

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
  v_now timestamptz := now();
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

  -- Bug fix (Mission 11): explicitly publish every translation row this
  -- editorial question is published with, instead of leaving `status` to
  -- fall back to its 'ai_draft' column default — that default made these
  -- rows permanently unreadable by gameplay (and by the authenticated RLS
  -- policy on question_translations) despite the parent question already
  -- being live.
  with inserted as (
    insert into public.question_translations (
      question_id, language_code, question_text, choice_1, choice_2, choice_3, choice_4, explanation, reflection,
      status, reviewed_by, reviewed_at, published_at, updated_at
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
      t ->> 'reflection',
      'published',
      p_reviewer,
      v_now,
      v_now,
      v_now
    from jsonb_array_elements(p_translations) as t
    returning question_id, language_code
  )
  insert into public.translation_review_history (question_id, language_code, action, actor, detail)
  select question_id, language_code, 'published', p_reviewer, jsonb_build_object('via', 'publish_editorial_question')
  from inserted;

  update public.question_review_overlay
  set status = 'published', reviewer = p_reviewer, reviewed_at = v_now, updated_at = v_now
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

-- One-time backfill: any EDITORIAL-* question already published live
-- before this fix, whose translations are still stuck at ai_draft (the
-- exact symptom this migration fixes), gets its existing translations
-- published now — never overwriting content, only the workflow columns,
-- and only for rows tied to an already-published parent question (the
-- same gate gameplay itself uses).
update public.question_translations qt
set
  status = 'published',
  reviewed_by = coalesce(qt.reviewed_by, q.published_by),
  reviewed_at = coalesce(qt.reviewed_at, now()),
  published_at = coalesce(qt.published_at, now()),
  updated_at = now()
from public.questions q
where q.id = qt.question_id
  and q.status = 'published'
  and q.source_type is not null
  and qt.status in ('ai_draft', 'needs_review', 'approved');

-- Same backfill for the OTHER broken pathway this mission fixes
-- (app/api/admin/factory-review/route.ts): AI-Factory-authored questions
-- (source_type IS NULL) that an admin already approved via "Approve &
-- Publish" before this fix, whose translations never followed the parent
-- question to 'published' because that route used to update only
-- questions.status.
update public.question_translations qt
set
  status = 'published',
  reviewed_by = coalesce(qt.reviewed_by, 'backfill: mission11 factory-review fix'),
  reviewed_at = coalesce(qt.reviewed_at, now()),
  published_at = coalesce(qt.published_at, now()),
  updated_at = now()
from public.questions q
where q.id = qt.question_id
  and q.status = 'published'
  and q.source_type is null
  and qt.status in ('ai_draft', 'needs_review', 'approved');
