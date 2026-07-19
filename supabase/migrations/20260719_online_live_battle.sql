-- Menorah Bible Quiz — Online Live Battle (host TV + private player phones)
-- Run after 20260711_final_multiplayer.sql and 20260718_global_leaderboard.sql.
--
-- This migration is additive/hardening only: no existing table is dropped,
-- and every existing column keeps its name and meaning (see the mapping
-- notes below) so nothing already shipped breaks.
--
-- Name mapping vs. the brief (reusing existing columns, no duplicates):
--   rooms.host_id            -> "host_player_id"
--   rooms.status             -> "round_phase" (values extended below)
--   rooms.current_question   -> "current_question_index" (1-indexed)
--   rooms.question_started_at / question_ends_at -> "round_started_at" / "round_ends_at"
--   rooms.category_id / game_level -> "category" / "level"
--   room_players.is_ready     -> "ready"
--
-- New phase model (rooms.status), replacing the old 4-value enum with 6:
--   waiting | countdown | question | reveal | leaderboard | finished
-- ("question" replaces the old "playing"; every consumer of this column
-- is being rewritten in this same change, so there is nothing left on the
-- old values to preserve compatibility with.)

-- ---------------------------------------------------------------------------
-- 1. Schema: extend rooms, room_players
-- ---------------------------------------------------------------------------
alter table public.rooms drop constraint if exists rooms_status_check;
alter table public.rooms add constraint rooms_status_check
  check (status in ('waiting', 'countdown', 'question', 'reveal', 'leaderboard', 'finished'));

-- Any room left mid-flight on the old enum's "playing"/"revealing" values
-- maps onto the new model so it doesn't get stuck failing the new check.
update public.rooms set status = 'question' where status = 'playing';
update public.rooms set status = 'reveal' where status = 'revealing';

alter table public.rooms
  add column if not exists question_count int not null default 10 check (question_count between 1 and 20);

alter table public.room_players
  add column if not exists current_streak int not null default 0 check (current_streak >= 0),
  add column if not exists last_seen_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- 2. Column-level grants — the security-critical piece
-- ---------------------------------------------------------------------------
-- A player may only ever touch their OWN presence/readiness columns
-- directly. score, current_streak, and every "answers" scoring column can
-- now ONLY be written by the SECURITY DEFINER RPCs below (which run as
-- the function owner, independent of these grants) — never by a client
-- update, no matter what the browser sends.
revoke update on public.room_players from authenticated;
grant update (is_ready, last_seen_at) on public.room_players to authenticated;

revoke update on public.answers from authenticated;
-- No columns granted: once inserted, an answer row is immutable from the
-- client. Scoring is applied only by resolve_round(...) below.

revoke insert on public.answers from authenticated;
-- Answers may only be created via submit_answer(...) below (never a
-- direct client insert), so is_correct/response_time_ms/points_awarded
-- can never be client-supplied.

-- Existing "Users can update own room player" / "Hosts score answers" /
-- "Hosts can update room player scores" policies still exist from the
-- first migration; they remain harmless because the GRANTs above now
-- restrict which columns any such UPDATE can actually touch. The
-- policies below add the missing capabilities the brief asks for.

drop policy if exists "Hosts can remove players" on public.room_players;
create policy "Hosts can remove players" on public.room_players
for delete to authenticated using (
  exists (select 1 from public.rooms r where r.id = room_players.room_id and r.host_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- 3. submit_answer — secure, server-computed answer recording
-- ---------------------------------------------------------------------------
-- Computes is_correct and response_time_ms itself (never trusts the
-- client for either), verifies the room is actually in the "question"
-- phase, verifies the caller is a member of the room, and relies on the
-- existing unique(room_question_id, player_id) constraint to make a
-- second submission a no-op rather than an error.
create or replace function public.submit_answer(
  p_room_id uuid,
  p_room_question_id uuid,
  p_selected_answer int
)
returns table (already_submitted boolean, is_correct boolean)
security definer
set search_path = public
language plpgsql
as $$
declare
  v_player_id uuid := auth.uid();
  v_room record;
  v_room_question record;
  v_correct_index int;
  v_is_correct boolean;
  v_response_ms int;
  v_existing record;
begin
  if v_player_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_selected_answer < 0 or p_selected_answer > 3 then
    raise exception 'Invalid answer index';
  end if;

  select * into v_room from public.rooms where id = p_room_id for update;
  if not found then
    raise exception 'Room not found';
  end if;
  if v_room.status <> 'question' then
    raise exception 'This room is not accepting answers right now';
  end if;

  select * into v_room_question from public.room_questions
    where id = p_room_question_id and room_id = p_room_id;
  if not found then
    raise exception 'Question not found for this room';
  end if;

  if not exists (
    select 1 from public.room_players rp
    where rp.room_id = p_room_id and rp.player_id = v_player_id
  ) then
    raise exception 'You are not a member of this room';
  end if;

  select correct_index into v_correct_index
    from public.questions where id = v_room_question.question_id;
  if v_correct_index is null then
    raise exception 'Question data missing';
  end if;

  v_is_correct := (p_selected_answer = v_correct_index);
  v_response_ms := greatest(0, extract(epoch from (now() - coalesce(v_room.question_started_at, now()))) * 1000)::int;

  select * into v_existing from public.answers
    where room_question_id = p_room_question_id and player_id = v_player_id;
  if found then
    return query select true, v_existing.is_correct;
    return;
  end if;

  insert into public.answers (
    room_id, room_question_id, player_id, selected_answer,
    is_correct, response_time_ms, points_awarded, submitted_at
  ) values (
    p_room_id, p_room_question_id, v_player_id, p_selected_answer,
    v_is_correct, v_response_ms, 0, now()
  );

  update public.room_players set last_seen_at = now()
    where room_id = p_room_id and player_id = v_player_id;

  return query select false, v_is_correct;
end;
$$;

revoke all on function public.submit_answer(uuid, uuid, int) from public;
grant execute on function public.submit_answer(uuid, uuid, int) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. resolve_round — secure scoring + question -> reveal transition
-- ---------------------------------------------------------------------------
-- Host-only (verified inside the function, not just trusted from the
-- client). Ranks correct answers by submission time, assigns points using
-- the same rank-based formula the app has always used (100/75/50/25,
-- doubled on the final question), updates each player's score and
-- current_streak in one transaction, and flips the room to "reveal".
-- Calling it twice for the same round is a safe no-op (guarded by the
-- status check), so a double-click or a retried network request can't
-- double-score a round.
create or replace function public.resolve_round(p_room_id uuid)
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  v_room record;
  v_room_question record;
  v_is_final boolean;
  v_rank int := 0;
  v_points int;
  v_answer record;
begin
  select * into v_room from public.rooms where id = p_room_id for update;
  if not found then
    raise exception 'Room not found';
  end if;
  if v_room.host_id <> auth.uid() then
    raise exception 'Only the host can resolve a round';
  end if;
  if v_room.status <> 'question' then
    return; -- already resolved (or not yet started) — safe no-op
  end if;

  select * into v_room_question from public.room_questions
    where room_id = p_room_id and question_number = v_room.current_question;
  if not found then
    raise exception 'No active question for this room';
  end if;

  v_is_final := (v_room.current_question >= v_room.question_count);

  for v_answer in
    select * from public.answers
    where room_question_id = v_room_question.id and is_correct = true
    order by submitted_at asc
  loop
    v_points := (case v_rank when 0 then 100 when 1 then 75 when 2 then 50 else 25 end)
      * (case when v_is_final then 2 else 1 end);

    update public.answers set points_awarded = v_points where id = v_answer.id;
    update public.room_players
      set score = score + v_points, current_streak = current_streak + 1
      where room_id = p_room_id and player_id = v_answer.player_id;

    v_rank := v_rank + 1;
  end loop;

  -- Anyone who answered incorrectly (or not at all) loses their streak.
  update public.room_players
    set current_streak = 0
    where room_id = p_room_id
      and player_id not in (
        select player_id from public.answers
        where room_question_id = v_room_question.id and is_correct = true
      );

  update public.rooms set status = 'reveal' where id = p_room_id;
end;
$$;

revoke all on function public.resolve_round(uuid) from public;
grant execute on function public.resolve_round(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. advance_phase — host-only, non-scoring phase transitions
-- ---------------------------------------------------------------------------
-- Covers reveal -> leaderboard -> countdown -> question(next) / finished.
-- These transitions don't touch scores, so a plain host-authenticated
-- update would already be safe under the existing "Hosts can update
-- rooms" RLS policy — this RPC just keeps the state-machine rules
-- (which transitions are legal from which phase) in one trusted place
-- instead of duplicated across every client call site.
create or replace function public.advance_phase(
  p_room_id uuid,
  p_to text
)
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  v_room record;
  v_now timestamptz := now();
begin
  select * into v_room from public.rooms where id = p_room_id for update;
  if not found then
    raise exception 'Room not found';
  end if;
  if v_room.host_id <> auth.uid() then
    raise exception 'Only the host can advance the room';
  end if;

  if p_to = 'leaderboard' and v_room.status = 'reveal' then
    update public.rooms set status = 'leaderboard' where id = p_room_id;
  elsif p_to = 'countdown' and v_room.status in ('waiting', 'leaderboard') then
    update public.rooms set status = 'countdown' where id = p_room_id;
  elsif p_to = 'question' and v_room.status = 'countdown' then
    if v_room.current_question >= v_room.question_count then
      raise exception 'No more questions';
    end if;
    update public.rooms set
      status = 'question',
      current_question = current_question + 1,
      question_started_at = v_now,
      question_ends_at = v_now + interval '15 seconds'
    where id = p_room_id;
  elsif p_to = 'finished' and v_room.status = 'leaderboard' then
    update public.rooms set status = 'finished', question_started_at = null, question_ends_at = null
      where id = p_room_id;
  elsif p_to = 'waiting' then
    -- Restart: clear this room's answers and every player's score/streak,
    -- return to the lobby so the host can Start again fresh.
    delete from public.answers where room_id = p_room_id;
    delete from public.room_questions where room_id = p_room_id;
    update public.room_players set score = 0, current_streak = 0 where room_id = p_room_id;
    update public.rooms set
      status = 'waiting', current_question = 0,
      question_started_at = null, question_ends_at = null
    where id = p_room_id;
  else
    raise exception 'Invalid phase transition: % -> %', v_room.status, p_to;
  end if;
end;
$$;

revoke all on function public.advance_phase(uuid, text) from public;
grant execute on function public.advance_phase(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. start_battle — host-only waiting -> countdown, with question seeding
-- ---------------------------------------------------------------------------
-- The actual question IDs are still chosen client-side (same local/DB
-- question-bank fallback logic the app already has) and inserted into
-- room_questions by the host client, exactly as before — this RPC only
-- performs the trusted part: verifying the caller really is the host and
-- flipping waiting -> countdown once room_questions already has rows.
create or replace function public.start_battle(p_room_id uuid)
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  v_room record;
begin
  select * into v_room from public.rooms where id = p_room_id for update;
  if not found then
    raise exception 'Room not found';
  end if;
  if v_room.host_id <> auth.uid() then
    raise exception 'Only the host can start the battle';
  end if;
  if v_room.status <> 'waiting' then
    raise exception 'Battle already started';
  end if;
  if (select count(*) from public.room_players where room_id = p_room_id) < 2 then
    raise exception 'At least two players are required to start';
  end if;
  if (select count(*) from public.room_questions where room_id = p_room_id) < v_room.question_count then
    raise exception 'Questions are not ready yet';
  end if;

  update public.rooms set status = 'countdown' where id = p_room_id;
end;
$$;

revoke all on function public.start_battle(uuid) from public;
grant execute on function public.start_battle(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. get_room_question — the current question, with the answer redacted
--    until it's actually time to reveal it
-- ---------------------------------------------------------------------------
-- public.questions/question_translations are readable by any authenticated
-- user via the existing "published" policy from the first migration — that
-- was fine when the only consumer was solo play (which shows the answer
-- immediately after locking anyway), but a live-battle player could
-- otherwise query questions.correct_index directly and see the answer
-- before the round ends. This RPC is the one path the new battle UI uses
-- instead: it always returns the question text/choices, but only returns
-- correct_index/explanation once this room's phase has actually reached
-- reveal (or later) — so "reading the hidden answer before reveal" isn't
-- possible through this call, regardless of what the client asks for.
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
  explanation text
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
    case when r.status in ('reveal', 'leaderboard', 'finished') then coalesce(qt.explanation, qt_en.explanation) else null end as explanation
  from public.rooms r
  join public.room_questions rq on rq.room_id = r.id and rq.question_number = r.current_question
  join public.questions q on q.id = rq.question_id
  left join public.question_translations qt on qt.question_id = q.id and qt.language_code = p_lang
  left join public.question_translations qt_en on qt_en.question_id = q.id and qt_en.language_code = 'en'
  where r.id = p_room_id
    and exists (select 1 from public.room_players rp where rp.room_id = r.id and rp.player_id = auth.uid());
$$;

revoke all on function public.get_room_question(uuid, text) from public;
grant execute on function public.get_room_question(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Realtime — extend the existing publication (room_players/answers/
--    rooms already added by the first migration; this is a no-op if so).
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.rooms;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.room_players;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.answers;
exception when duplicate_object then null; end $$;
