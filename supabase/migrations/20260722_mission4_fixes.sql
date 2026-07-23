-- Menorah Bible Quiz — Mission 4 fix pass (Friends Battle multiplayer audit)
-- Run after 20260719_online_live_battle.sql.
--
-- This migration is additive/hardening only, exactly like the previous one:
-- no table is dropped, no existing column is renamed or repurposed, and
-- every fix reuses a pattern already established in
-- 20260719_online_live_battle.sql (SECURITY DEFINER RPCs, any-room-member
-- deadline-triggered advancement) rather than introducing a new mechanism.
--
-- Fixes applied (see MISSION-4-AUDIT.md for the corresponding finding):
--   1. Room capacity race            -> new join_room() RPC (atomic)
--   2. Duplicate answer submission race -> submit_answer() insert-first rewrite
--   3. Duplicate player-name handling -> auto-disambiguation inside join_room()
--   5. is_ready not reset on replay   -> advance_phase('waiting') now resets it
--   6. Host DELETE on answers        -> revoked; dead policies dropped
--   7. Host-disconnect freeze in countdown/reveal/leaderboard -> new
--      phase_ends_at column + advance_phase_if_expired(), the same
--      any-member deadline pattern resolve_round_if_expired() already uses
--      for the question phase, using the exact COUNTDOWN_SECONDS/
--      REVEAL_SECONDS/LEADERBOARD_SECONDS values already defined (and
--      previously unused) in lib/liveBattleRoom.ts.

-- ---------------------------------------------------------------------------
-- 1. Fix 7 schema: a generic "current phase deadline" column, alongside the
--    existing question-specific question_started_at/question_ends_at
--    (left untouched — still scoped to the "question" phase only).
-- ---------------------------------------------------------------------------
alter table public.rooms add column if not exists phase_ends_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Fix 1 + Fix 3: join_room — atomic capacity check + auto-disambiguated
--    join, replacing the client's separate count-then-upsert (which had a
--    TOCTOU race right at capacity).
-- ---------------------------------------------------------------------------
create or replace function public.join_room(
  p_room_code text,
  p_display_name text
)
returns table (room_id uuid, language text)
security definer
set search_path = public
language plpgsql
as $$
declare
  v_player_id uuid := auth.uid();
  v_room record;
  v_final_name text;
  v_suffix int := 1;
begin
  if v_player_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Locking the room row serializes every concurrent join attempt for this
  -- room, so the capacity check below and the insert happen atomically
  -- together — no two joiners can both read "one slot left" and both get in.
  select * into v_room from public.rooms where code = upper(p_room_code) for update;
  if not found then
    raise exception 'Room not found.';
  end if;
  if v_room.status <> 'waiting' then
    raise exception 'This battle has already started.';
  end if;
  if (
    select count(*) from public.room_players rp where rp.room_id = v_room.id
  ) >= v_room.max_players and not exists (
    select 1 from public.room_players rp where rp.room_id = v_room.id and rp.player_id = v_player_id
  ) then
    raise exception 'This room is full.';
  end if;

  -- Auto-disambiguate a colliding display name against every OTHER player
  -- already in this room (not against the caller's own existing row, so a
  -- reconnecting player keeps their own name unchanged).
  v_final_name := p_display_name;
  while exists (
    select 1 from public.room_players rp
    where rp.room_id = v_room.id
      and rp.player_id <> v_player_id
      and rp.display_name = v_final_name
  ) loop
    v_suffix := v_suffix + 1;
    v_final_name := p_display_name || ' (' || v_suffix || ')';
  end loop;

  -- An explicit exists-check + insert/update (instead of INSERT ... ON
  -- CONFLICT) sidesteps a column/OUT-parameter name collision on
  -- "room_id" — and is still race-free here, because every concurrent
  -- join_room() call for this room is already serialized behind the
  -- `for update` row lock taken on v_room above.
  if exists (
    select 1 from public.room_players rp where rp.room_id = v_room.id and rp.player_id = v_player_id
  ) then
    update public.room_players as rp set display_name = v_final_name, score = 0, is_ready = true
      where rp.room_id = v_room.id and rp.player_id = v_player_id;
  else
    insert into public.room_players (room_id, player_id, display_name, score, is_ready)
    values (v_room.id, v_player_id, v_final_name, 0, true);
  end if;

  return query select v_room.id, v_room.language;
end;
$$;

revoke all on function public.join_room(text, text) from public;
grant execute on function public.join_room(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Fix 2: submit_answer — insert-first (ON CONFLICT DO NOTHING) instead of
--    select-then-insert, closing the narrow window where two truly
--    concurrent calls for the same player+question could both pass the
--    "not found" check before either committed.
-- ---------------------------------------------------------------------------
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

  insert into public.answers (
    room_id, room_question_id, player_id, selected_answer,
    is_correct, response_time_ms, points_awarded, submitted_at
  ) values (
    p_room_id, p_room_question_id, v_player_id, p_selected_answer,
    v_is_correct, v_response_ms, 0, now()
  )
  on conflict (room_question_id, player_id) do nothing;

  if not found then
    -- Someone else's concurrent call (or this same player's own retry)
    -- already inserted the row first — return their stored result instead
    -- of erroring, exactly as the previous select-then-insert version did
    -- for the non-concurrent case.
    select * into v_existing from public.answers
      where room_question_id = p_room_question_id and player_id = v_player_id;
    return query select true, v_existing.is_correct;
    return;
  end if;

  update public.room_players set last_seen_at = now()
    where room_id = p_room_id and player_id = v_player_id;

  return query select false, v_is_correct;
end;
$$;

revoke all on function public.submit_answer(uuid, uuid, int) from public;
grant execute on function public.submit_answer(uuid, uuid, int) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Fix 7: set phase_ends_at on every transition into countdown/reveal/
--    leaderboard, and clear it when leaving those phases — start_battle,
--    _resolve_round_internal, and advance_phase are all re-created below
--    with this one addition each; every other line is unchanged from
--    20260719_online_live_battle.sql.
-- ---------------------------------------------------------------------------
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

  update public.rooms set status = 'countdown', phase_ends_at = now() + interval '3 seconds' where id = p_room_id;
end;
$$;

revoke all on function public.start_battle(uuid) from public;
grant execute on function public.start_battle(uuid) to authenticated;

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

  update public.rooms set status = 'reveal', phase_ends_at = now() + interval '5 seconds' where id = p_room_id;
end;
$$;

revoke all on function public._resolve_round_internal(uuid) from public;

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
    update public.rooms set status = 'leaderboard', phase_ends_at = v_now + interval '4 seconds' where id = p_room_id;
  elsif p_to = 'countdown' and v_room.status in ('waiting', 'leaderboard') then
    update public.rooms set status = 'countdown', phase_ends_at = v_now + interval '3 seconds' where id = p_room_id;
  elsif p_to = 'question' and v_room.status = 'countdown' then
    if v_room.current_question >= v_room.question_count then
      raise exception 'No more questions';
    end if;
    update public.rooms set
      status = 'question',
      current_question = current_question + 1,
      question_started_at = v_now,
      question_ends_at = v_now + interval '15 seconds',
      phase_ends_at = null
    where id = p_room_id;
  elsif p_to = 'finished' and v_room.status = 'leaderboard' then
    update public.rooms set status = 'finished', question_started_at = null, question_ends_at = null, phase_ends_at = null
      where id = p_room_id;
  elsif p_to = 'waiting' then
    -- Restart: clear this room's answers and every player's score/streak,
    -- return to the lobby so the host can Start again fresh. Also reset
    -- is_ready so a player who had toggled themselves not-ready in the
    -- previous game doesn't stay stuck not-ready after a replay (Fix 5).
    delete from public.answers where room_id = p_room_id;
    delete from public.room_questions where room_id = p_room_id;
    update public.room_players set score = 0, current_streak = 0, is_ready = true where room_id = p_room_id;
    update public.rooms set
      status = 'waiting', current_question = 0,
      question_started_at = null, question_ends_at = null, phase_ends_at = null
    where id = p_room_id;
  else
    raise exception 'Invalid phase transition: % -> %', v_room.status, p_to;
  end if;
end;
$$;

revoke all on function public.advance_phase(uuid, text) from public;
grant execute on function public.advance_phase(uuid, text) to authenticated;

-- Deadline-triggered phase advancement, callable by ANY room member — the
-- exact same pattern resolve_round_if_expired() already established for the
-- question phase, extended to the three remaining host-only transitions
-- (countdown -> question, reveal -> leaderboard, leaderboard -> next). A
-- call before the relevant deadline is a silent no-op, so this can never
-- cut a phase short while the host is actively present; it only rescues a
-- room whose host has disconnected and stopped clicking Continue.
create or replace function public.advance_phase_if_expired(p_room_id uuid)
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
    return;
  end if;
  if v_room.phase_ends_at is null or now() <= v_room.phase_ends_at then
    return; -- not actually expired yet — silent no-op, not an error
  end if;
  if not exists (
    select 1 from public.room_players rp
    where rp.room_id = p_room_id and rp.player_id = auth.uid()
  ) then
    raise exception 'You are not a member of this room';
  end if;

  if v_room.status = 'countdown' then
    if v_room.current_question >= v_room.question_count then
      return;
    end if;
    update public.rooms set
      status = 'question',
      current_question = current_question + 1,
      question_started_at = v_now,
      question_ends_at = v_now + interval '15 seconds',
      phase_ends_at = null
    where id = p_room_id;
  elsif v_room.status = 'reveal' then
    update public.rooms set status = 'leaderboard', phase_ends_at = v_now + interval '4 seconds'
      where id = p_room_id;
  elsif v_room.status = 'leaderboard' then
    if v_room.current_question >= v_room.question_count then
      update public.rooms set status = 'finished', question_started_at = null, question_ends_at = null, phase_ends_at = null
        where id = p_room_id;
    else
      update public.rooms set status = 'countdown', phase_ends_at = v_now + interval '3 seconds'
        where id = p_room_id;
    end if;
  end if;
  -- waiting/question/finished have no host-only auto-advance step here:
  -- "question" already has its own resolve_round_if_expired; the others
  -- don't advance on their own by design.
end;
$$;

revoke all on function public.advance_phase_if_expired(uuid) from public;
grant execute on function public.advance_phase_if_expired(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Fix 6: remove the host's direct DELETE on answers (the intentional
--    "clear this room's answers on restart" behavior already runs entirely
--    inside advance_phase(..., 'waiting') above, a SECURITY DEFINER
--    function that executes as its owner and is completely unaffected by
--    this revoke — nothing intended breaks). Also drop the two RLS
--    policies this leaves permanently unreachable, so the policy list
--    accurately reflects what a client can actually do.
-- ---------------------------------------------------------------------------
revoke delete on public.answers from authenticated;

drop policy if exists "Hosts clear room answers" on public.answers;
drop policy if exists "Hosts score answers" on public.answers;
