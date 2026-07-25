-- Mission 13 — Per-player language selection for Online Live Battle.
--
-- Root cause of the bug this fixes: every client (host AND every joined
-- player) called get_room_question(room_id, room.language) — the HOST's
-- chosen language, room-wide. A player who could not read the host's
-- language had no way to see the question in their own language, even
-- though get_room_question() already accepted a p_lang argument per call.
--
-- This migration only adds a per-player language column and a guarded way
-- to set it, plus restores an EXPLICIT (never silent — see the
-- translation_available flag) English fallback in get_room_question() so a
-- player whose language has no published translation for a given question
-- still gets a playable question instead of a blank screen. Room
-- synchronization itself (question order, timers, scoring, answer
-- submission, winner calculation) is completely untouched.
--
-- Idempotent: safe to run more than once.
--
-- ROLLBACK:
--   drop function if exists public.set_room_player_language(uuid, text);
--   alter table public.room_players drop column if exists language_code;
--   -- restore the Mission 10 get_room_question (no English coalesce) by
--   -- re-running the CREATE FUNCTION block from
--   -- supabase/migrations/20260730_mission10_translation_workflow.sql.

-- ---------------------------------------------------------------------------
-- 1. room_players.language_code — each player's own display language.
--    Backfilled from the room's language so every existing row (created
--    before this migration) keeps behaving exactly as it does today.
-- ---------------------------------------------------------------------------
alter table public.room_players
  add column if not exists language_code text;

update public.room_players rp
set language_code = r.language
from public.rooms r
where r.id = rp.room_id
  and rp.language_code is null;

update public.room_players set language_code = 'en' where language_code is null;

alter table public.room_players alter column language_code set default 'en';
alter table public.room_players alter column language_code set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'room_players_language_code_check') then
    alter table public.room_players
      add constraint room_players_language_code_check
      check (language_code in ('en','am','om','ti','es','fr','ar','pt','sw','hi','zh','ko','de','it','ja'));
  end if;
end $$;

comment on column public.room_players.language_code is
  'Mission 13: the language THIS player sees question/answer text in — independent of rooms.language (the host''s own language, which only ever affects the host''s own screen). Chosen before joining the waiting room, changeable while room.status = ''waiting'' only (see set_room_player_language), locked once the battle starts.';

-- ---------------------------------------------------------------------------
-- 2. set_room_player_language — the only way language_code can change after
--    the initial join insert. A direct column grant (like is_ready/
--    last_seen_at) would let a player change language mid-battle with
--    nothing server-side stopping them; this RPC enforces the "locked once
--    the match starts" rule regardless of what the client does.
-- ---------------------------------------------------------------------------
create or replace function public.set_room_player_language(
  p_room_id uuid,
  p_language_code text
)
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  v_player_id uuid := auth.uid();
  v_room record;
begin
  if v_player_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_language_code not in ('en','am','om','ti','es','fr','ar','pt','sw','hi','zh','ko','de','it','ja') then
    raise exception 'Unsupported language code';
  end if;

  select * into v_room from public.rooms where id = p_room_id for update;
  if not found then
    raise exception 'Room not found';
  end if;
  if v_room.status <> 'waiting' then
    raise exception 'Language is locked once the battle has started';
  end if;

  update public.room_players
  set language_code = p_language_code, last_seen_at = now()
  where room_id = p_room_id and player_id = v_player_id;

  if not found then
    raise exception 'You are not a member of this room';
  end if;
end;
$$;

revoke all on function public.set_room_player_language(uuid, text) from public;
grant execute on function public.set_room_player_language(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. get_room_question(): add back an EXPLICIT English fallback.
--
-- Mission 10 removed the old silent English-coalesce (good — CLAUDE.md rule
-- 5 bans silently substituting English for a room-wide language). But now
-- that language is chosen per PLAYER rather than per room, seedRoomQuestions()
-- can only guarantee translations exist in the HOST's language — a
-- individual player's own choice may genuinely have no published
-- translation for some question. Rather than that player seeing a blank
-- question (translation_available: false, no text at all, as today), fall
-- back to English content for THAT PLAYER's own fetch, while still
-- returning translation_available: false so the client shows an explicit
-- "Translation unavailable. Showing English." message — never a silent
-- substitution, and it can only ever affect the one player whose fetch this
-- is (every call is already scoped to auth.uid() via the room_players
-- membership check below).
--
-- Return shape is identical to the Mission 10 version, so this can be a
-- plain CREATE OR REPLACE (no drop needed).
-- ---------------------------------------------------------------------------
create or replace function public.get_room_question(
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
    coalesce(qt.question_text, qt_en.question_text) as question_text,
    coalesce(qt.choice_1, qt_en.choice_1) as choice_1,
    coalesce(qt.choice_2, qt_en.choice_2) as choice_2,
    coalesce(qt.choice_3, qt_en.choice_3) as choice_3,
    coalesce(qt.choice_4, qt_en.choice_4) as choice_4,
    case when r.status in ('reveal', 'leaderboard', 'finished') then q.correct_index else null end as correct_index,
    case when r.status in ('reveal', 'leaderboard', 'finished') then coalesce(qt.explanation, qt_en.explanation) else null end as explanation,
    (qt.question_id is not null) as translation_available
  from public.rooms r
  join public.room_questions rq on rq.room_id = r.id and rq.question_number = r.current_question
  join public.questions q on q.id = rq.question_id
  left join public.question_translations qt
    on qt.question_id = q.id and qt.language_code = p_lang and qt.status = 'published'
  left join public.question_translations qt_en
    on qt_en.question_id = q.id and qt_en.language_code = 'en' and qt_en.status = 'published'
  where r.id = p_room_id
    and exists (select 1 from public.room_players rp where rp.room_id = r.id and rp.player_id = auth.uid());
$$;

revoke all on function public.get_room_question(uuid, text) from public;
grant execute on function public.get_room_question(uuid, text) to authenticated;
