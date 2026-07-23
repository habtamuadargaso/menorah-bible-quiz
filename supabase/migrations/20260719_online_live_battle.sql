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
--
-- ===========================================================================
-- SECURITY MODEL — how answers stay hidden, and how solo play still works
-- ===========================================================================
-- Two separate leaks existed in the first cut of this migration and are
-- closed here:
--
-- 1. HIDDEN ANSWERS (questions.correct_index / question_translations.explanation)
--    get_room_question() (section 7) already redacted correct_index/
--    explanation until reveal — but that only helped if every client used
--    that RPC. The base migration's blanket
--    `grant select on public.questions, public.question_translations to
--    authenticated` meant any authenticated client could still read
--    correct_index straight off the table (or via room_questions.question_id,
--    which is readable for a room's full 10-question set up front). Section 0
--    below revokes that blanket grant and re-grants only the non-answer
--    columns, so `correct_index`/`explanation` are no longer selectable by
--    any authenticated client, full stop — not just through the app's own
--    queries, but through a raw PostgREST call too.
--
--    Solo play still needs the answer client-side (it grades instantly, with
--    no per-question server round trip). It now gets it through
--    get_question_answer_keys(question_ids[], lang) (section 0), a
--    SECURITY DEFINER function that runs as the function owner and so is
--    unaffected by the column revoke. It returns the answer for any
--    *published* question UNLESS that exact question is the current,
--    not-yet-revealed question of a live-battle room the caller belongs to —
--    a condition solo play never satisfies (it has no room), so solo play is
--    unaffected, while a battle player trying to call this directly for an
--    in-progress room question gets nothing back.
--
--    Live battle keeps using get_room_question(), unchanged: it only reveals
--    correct_index/explanation once the room's phase has reached reveal.
--
-- 2. PRIVATE ANSWERS (answers.selected_answer / is_correct / response_time_ms)
--    The base migration's "Room members can read answers" policy let any
--    player in a room read every other player's selected_answer in real
--    time, including mid-question. Section 2 replaces it with an
--    "own row only" policy, plus SECURITY DEFINER RPCs for every
--    legitimate cross-player read the UI needs:
--      - get_answer_count(room_question_id)   -> just a count, any phase
--      - get_my_answer(room_question_id)      -> caller's own row, any phase
--      - get_reveal_answers(room_question_id) -> full breakdown, reveal+ only
--      - get_final_leaderboard(room_id)       -> scores/streaks (already
--        public via room_players), bundled with server-computed rank
--      - get_final_stats(room_id)             -> room-wide totals only
--        (accuracy %, fastest response), finished rooms only
--    The host's live "N of M answered" counter now polls get_answer_count()
--    instead of subscribing to realtime changes on `answers` — Realtime's
--    postgres_changes payload is not guaranteed to respect column-level
--    grants the way a plain query does, so the app no longer relies on that
--    channel for this table at all.

-- ---------------------------------------------------------------------------
-- 0. Hidden-answer security: lock down correct_index / explanation
-- ---------------------------------------------------------------------------
revoke select on public.questions from authenticated;
grant select (id, level, category, book, chapter, difficulty, reference, status, created_at, updated_at)
  on public.questions to authenticated;

revoke select on public.question_translations from authenticated;
grant select (id, question_id, language_code, question_text, choice_1, choice_2, choice_3, choice_4, reflection, created_at, updated_at)
  on public.question_translations to authenticated;

-- Safe, batched answer-key lookup for solo play (see security model note
-- above). Blocks only the exact case of "this question is the live,
-- not-yet-revealed question of a room I'm in" — everything else (solo play,
-- already-revealed battle questions, questions from rooms you're not in)
-- is allowed, same as the old blanket grant was for solo play.
create or replace function public.get_question_answer_keys(
  p_question_ids text[],
  p_lang text default 'en'
)
returns table (
  question_id text,
  correct_index int,
  explanation text
)
security definer
set search_path = public
language sql
stable
as $$
  select
    q.id,
    q.correct_index,
    coalesce(qt.explanation, qt_en.explanation)
  from public.questions q
  left join public.question_translations qt on qt.question_id = q.id and qt.language_code = p_lang
  left join public.question_translations qt_en on qt_en.question_id = q.id and qt_en.language_code = 'en'
  where q.id = any(p_question_ids)
    and q.status = 'published'
    and not exists (
      select 1
      from public.room_questions rq
      join public.rooms r on r.id = rq.room_id
      where rq.question_id = q.id
        and exists (
          select 1 from public.room_players rp
          where rp.room_id = r.id and rp.player_id = auth.uid()
        )
        and r.status <> 'finished'
        and not (
          rq.question_number < r.current_question
          or (rq.question_number = r.current_question and r.status in ('reveal', 'leaderboard'))
        )
    );
$$;

revoke all on function public.get_question_answer_keys(text[], text) from public;
grant execute on function public.get_question_answer_keys(text[], text) to authenticated;

-- ---------------------------------------------------------------------------
-- 1. Schema: extend rooms, room_players — fix old data BEFORE the new
--    constraint is added, so this migration works against a database that
--    already has real rooms sitting in the old 4-value status enum.
-- ---------------------------------------------------------------------------
alter table public.rooms drop constraint if exists rooms_status_check;

-- Any room left mid-flight on the old enum's "playing"/"revealing" values
-- maps onto the new model FIRST, so the new check constraint (added right
-- after) never has to validate against a row it doesn't recognize.
update public.rooms set status = 'question' where status = 'playing';
update public.rooms set status = 'reveal' where status = 'revealing';

alter table public.rooms add constraint rooms_status_check
  check (status in ('waiting', 'countdown', 'question', 'reveal', 'leaderboard', 'finished'));

-- question_count must not exceed what current_question / room_questions.
-- question_number can actually hold (both capped at 10 in the base
-- migration) — 1..20 here would silently produce unreachable questions
-- past #10. Kept at 1..10 for this release; raise all three together if
-- longer battles are ever added.
alter table public.rooms drop constraint if exists rooms_question_count_check;
alter table public.rooms
  add column if not exists question_count int not null default 10;
alter table public.rooms
  add constraint rooms_question_count_check check (question_count between 1 and 10);

alter table public.room_players
  add column if not exists current_streak int not null default 0 check (current_streak >= 0),
  add column if not exists last_seen_at timestamptz not null default now();

-- Database-only online questions: a room_questions row that pointed at a
-- question_id never stored in Supabase (e.g. a local-bank-only id) would
-- silently fail to join in get_room_question(), leaving a started battle
-- with no question. This FK makes that impossible at the database level,
-- regardless of what any client tries to insert.
alter table public.room_questions drop constraint if exists room_questions_question_id_fkey;
alter table public.room_questions
  add constraint room_questions_question_id_fkey foreign key (question_id) references public.questions(id);

-- ---------------------------------------------------------------------------
-- 2. Column-level grants + answer privacy — the security-critical piece
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

-- Private answers: replace "any room member can read every answer row"
-- with "only your own row" — see the RPCs in section 6 for every
-- legitimate cross-player read (counts, reveal breakdown, leaderboard).
drop policy if exists "Room members can read answers" on public.answers;
drop policy if exists "Players can read own answers" on public.answers;
create policy "Players can read own answers" on public.answers
for select to authenticated using (player_id = auth.uid());

drop policy if exists "Hosts can remove players" on public.room_players;
create policy "Hosts can remove players" on public.room_players
for delete to authenticated using (
  exists (select 1 from public.rooms r where r.id = room_players.room_id and r.host_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- 3. submit_answer — secure, server-computed, deadline-enforced
-- ---------------------------------------------------------------------------
-- Computes is_correct and response_time_ms itself (never trusts the
-- client for either), verifies the room is actually in the "question"
-- phase AND that the server-side deadline hasn't passed (a hidden or
-- modified client cannot submit late just by not rendering a disabled
-- button), verifies the caller is a member of the room, and relies on the
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
  if v_room.question_ends_at is not null and now() > v_room.question_ends_at then
    raise exception 'Time is up for this question';
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
-- 4. Round resolution — shared logic, two entry points
-- ---------------------------------------------------------------------------
-- _resolve_round_internal does the actual scoring + question -> reveal
-- transition (ranks correct answers by submission time, assigns points
-- using the same rank-based formula the app has always used: 100/75/50/25,
-- doubled on the final question). It is not itself exposed to clients —
-- only the two authorization wrappers below may call it.
create or replace function public._resolve_round_internal(p_room_id uuid)
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
  if not found or v_room.status <> 'question' then
    return; -- already resolved, or nothing to resolve — safe no-op
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

revoke all on function public._resolve_round_internal(uuid) from public;
-- Deliberately NOT granted to authenticated — only reachable through the
-- two wrappers below, each with its own authorization check.

-- Host-triggered early resolution (e.g. once every connected player has
-- answered, well before the timer runs out). Host-only, exactly as before.
create or replace function public.resolve_round(p_room_id uuid)
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  v_room record;
begin
  select * into v_room from public.rooms where id = p_room_id;
  if not found then
    raise exception 'Room not found';
  end if;
  if v_room.host_id <> auth.uid() then
    raise exception 'Only the host can resolve a round';
  end if;
  perform public._resolve_round_internal(p_room_id);
end;
$$;

revoke all on function public.resolve_round(uuid) from public;
grant execute on function public.resolve_round(uuid) to authenticated;

-- Deadline-triggered resolution, callable by ANY room member (not just the
-- host). This is the fix for host-disconnect: round resolution no longer
-- depends solely on the host's browser being present and running a
-- window.setTimeout. It can only ever resolve a round that has genuinely
-- expired (checked server-side against now()), so it cannot be abused to
-- end a round early — a call before the deadline is a silent no-op. Every
-- connected player's client calls this once its own synced countdown hits
-- zero, so if the host has disconnected, the first player whose timer
-- expires resolves the round for everyone; if the host is present, both
-- entry points race harmlessly (whichever runs first wins, the second is a
-- no-op via the `status <> 'question'` guard in the internal function).
create or replace function public.resolve_round_if_expired(p_room_id uuid)
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  v_room record;
begin
  select * into v_room from public.rooms where id = p_room_id;
  if not found or v_room.status <> 'question' then
    return;
  end if;
  if v_room.question_ends_at is null or now() <= v_room.question_ends_at then
    return; -- not actually expired yet — silent no-op, not an error
  end if;
  if not exists (
    select 1 from public.room_players rp
    where rp.room_id = p_room_id and rp.player_id = auth.uid()
  ) then
    raise exception 'You are not a member of this room';
  end if;
  perform public._resolve_round_internal(p_room_id);
end;
$$;

revoke all on function public.resolve_round_if_expired(uuid) from public;
grant execute on function public.resolve_round_if_expired(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. advance_phase — host-only, non-scoring phase transitions
-- ---------------------------------------------------------------------------
-- Covers reveal -> leaderboard -> countdown -> question(next) / finished.
-- These transitions don't touch scores, so a plain host-authenticated
-- update would already be safe under the existing "Hosts can update
-- rooms" RLS policy — this RPC just keeps the state-machine rules
-- (which transitions are legal from which phase) in one trusted place
-- instead of duplicated across every client call site.
--
-- NOTE ON ORCHESTRATION: these transitions remain host-driven — only the
-- host can advance reveal -> leaderboard -> next question. There is no
-- backend scheduler or Edge Function in this project to advance a room
-- if the host disconnects during those phases; resolve_round_if_expired
-- above is the one exception, because "the question timer ran out" is the
-- one transition every player's own client can independently and safely
-- verify against now(). A true fix for host disconnection during
-- reveal/leaderboard would be a Supabase Edge Function on a schedule (e.g.
-- pg_cron calling a `resolve_expired_rooms()` SQL function every few
-- seconds) — that requires a deployed project to configure and is outside
-- what this migration can set up; see app-level handling for how the
-- player UI surfaces a disconnected host in the meantime.
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
-- The actual question IDs are still chosen client-side (same DB-only
-- question-bank logic the app already has, see lib/liveBattleRoom.ts) and
-- inserted into room_questions by the host client — this RPC performs the
-- trusted part: verifying the caller really is the host, and that every
-- room_questions row genuinely joins to a real, published question (not
-- just that room_questions has *a* row for each slot — the
-- room_questions_question_id_fkey constraint from section 1 already makes
-- a dangling question_id impossible to insert, but this join-based count
-- is kept as a second, independent check).
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
  if (
    select count(*) from public.room_questions rq
    join public.questions q on q.id = rq.question_id and q.status = 'published'
    where rq.room_id = p_room_id
  ) < v_room.question_count then
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
-- 8. Private-answer RPCs — every legitimate cross-player read, explicitly
--    scoped, now that "Room members can read answers" is gone (section 2)
-- ---------------------------------------------------------------------------

-- Just a count — never exposes what anyone chose. Safe during the
-- "question" phase, which is exactly when the host's "N of M answered"
-- indicator needs it.
create or replace function public.get_answer_count(p_room_question_id uuid)
returns int
security definer
set search_path = public
language sql
stable
as $$
  select count(*)::int
  from public.answers a
  where a.room_question_id = p_room_question_id
    and exists (
      select 1 from public.room_players rp
      where rp.room_id = a.room_id and rp.player_id = auth.uid()
    );
$$;

revoke all on function public.get_answer_count(uuid) from public;
grant execute on function public.get_answer_count(uuid) to authenticated;

-- The caller's own answer only — safe at any phase, since it's always the
-- caller's own data (they already know what they picked).
create or replace function public.get_my_answer(p_room_question_id uuid)
returns table (
  selected_answer int,
  is_correct boolean,
  response_time_ms int,
  points_awarded int,
  submitted_at timestamptz
)
security definer
set search_path = public
language sql
stable
as $$
  select a.selected_answer, a.is_correct, a.response_time_ms, a.points_awarded, a.submitted_at
  from public.answers a
  where a.room_question_id = p_room_question_id
    and a.player_id = auth.uid();
$$;

revoke all on function public.get_my_answer(uuid) from public;
grant execute on function public.get_my_answer(uuid) to authenticated;

-- Full per-player breakdown for a question — ONLY once that question's
-- round has actually ended (this room's phase has moved past "question"
-- for this exact question_number: an earlier question_number than the
-- room's current one, the current one during reveal/leaderboard, or the
-- room is finished). This is the one place individual selections become
-- visible to the rest of the room, and only after the round is over.
create or replace function public.get_reveal_answers(p_room_question_id uuid)
returns table (
  player_id uuid,
  selected_answer int,
  is_correct boolean,
  response_time_ms int,
  points_awarded int,
  submitted_at timestamptz
)
security definer
set search_path = public
language plpgsql
stable
as $$
declare
  v_room_question record;
  v_room record;
  v_revealed boolean;
begin
  select * into v_room_question from public.room_questions where id = p_room_question_id;
  if not found then
    return;
  end if;
  select * into v_room from public.rooms where id = v_room_question.room_id;
  if not found then
    return;
  end if;
  if not exists (select 1 from public.room_players rp where rp.room_id = v_room.id and rp.player_id = auth.uid()) then
    raise exception 'You are not a member of this room';
  end if;

  v_revealed := v_room.status = 'finished'
    or v_room_question.question_number < v_room.current_question
    or (v_room_question.question_number = v_room.current_question and v_room.status in ('reveal', 'leaderboard'));

  if not v_revealed then
    raise exception 'This question has not been revealed yet';
  end if;

  return query
  select a.player_id, a.selected_answer, a.is_correct, a.response_time_ms, a.points_awarded, a.submitted_at
  from public.answers a
  where a.room_question_id = p_room_question_id;
end;
$$;

revoke all on function public.get_reveal_answers(uuid) from public;
grant execute on function public.get_reveal_answers(uuid) to authenticated;

-- Final scoreboard: score/current_streak were already public via
-- room_players (a leaderboard is meant to be visible), this just excludes
-- the host's own non-competing row and bundles rank server-side so every
-- client doesn't have to re-sort/re-rank the same list independently.
create or replace function public.get_final_leaderboard(p_room_id uuid)
returns table (
  player_id uuid,
  display_name text,
  score int,
  current_streak int,
  rank int
)
security definer
set search_path = public
language sql
stable
as $$
  select
    rp.player_id,
    rp.display_name,
    rp.score,
    rp.current_streak,
    rank() over (order by rp.score desc)::int as rank
  from public.room_players rp
  join public.rooms r on r.id = rp.room_id
  where rp.room_id = p_room_id
    and rp.player_id <> r.host_id
    and exists (select 1 from public.room_players me where me.room_id = p_room_id and me.player_id = auth.uid())
  order by rp.score desc;
$$;

revoke all on function public.get_final_leaderboard(uuid) from public;
grant execute on function public.get_final_leaderboard(uuid) to authenticated;

-- Room-wide AGGREGATE stats for the final results screen (overall accuracy,
-- fastest correct response across the whole battle) — only once the room
-- is finished. Deliberately returns totals only, never a per-player
-- breakdown (that remains get_reveal_answers, one question at a time).
create or replace function public.get_final_stats(p_room_id uuid)
returns table (
  total_answers int,
  correct_answers int,
  fastest_correct_response_ms int
)
security definer
set search_path = public
language sql
stable
as $$
  select
    count(*)::int as total_answers,
    count(*) filter (where a.is_correct)::int as correct_answers,
    min(a.response_time_ms) filter (where a.is_correct)::int as fastest_correct_response_ms
  from public.answers a
  join public.rooms r on r.id = a.room_id
  where a.room_id = p_room_id
    and r.status = 'finished'
    and exists (select 1 from public.room_players rp where rp.room_id = p_room_id and rp.player_id = auth.uid());
$$;

revoke all on function public.get_final_stats(uuid) from public;
grant execute on function public.get_final_stats(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 9. Realtime — extend the existing publication (room_players/rooms
--    already added by the first migration; this is a no-op if so).
--    `answers` is deliberately left out of client-side realtime
--    subscriptions in the app now that individual rows are private (see
--    section 2) — the app polls get_answer_count()/calls the RPCs above
--    instead, which are unaffected by whatever Realtime does or doesn't
--    filter at the column level.
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.rooms;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.room_players;
exception when duplicate_object then null; end $$;
