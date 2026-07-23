-- Mission 7 Part 13 — data retention / cleanup.
--
-- Scope is deliberately narrow. This function ONLY ever targets abandoned
-- 'waiting' rooms (created, never started, nobody playing) older than 2
-- hours — the same category of room createBattleRoom() already
-- self-cleans on the *next* room creation by the same host (see
-- lib/liveBattleRoom.ts). This is the general sweep for rooms abandoned
-- by hosts who never come back.
--
-- 'playing' / 'revealing' rooms (an active game) are never touched —
-- CLAUDE.md/Mission 7: "Never delete active rooms."
--
-- 'finished' rooms are ALSO deliberately never touched by this function:
-- supabase/migrations/20260718_global_leaderboard.sql's get_leaderboard()
-- computes all-time win streaks and total_battle_wins by querying
-- room_players/rooms directly for status = 'finished', with no separate
-- aggregate table. Deleting old finished rooms would silently corrupt
-- every player's all-time leaderboard stats. If finished-room retention
-- is wanted later, it needs an aggregation step into profiles FIRST
-- (rollup total_battle_wins/best_win_streak onto the profile row), which
-- is a real schema change beyond this mission's scope — documented here
-- rather than silently built around.
--
-- Idempotent: `create or replace function`, safe to run repeatedly.

create or replace function public.cleanup_stale_rooms(p_dry_run boolean default true)
returns table(would_delete_count bigint, deleted_count bigint, room_ids uuid[])
security definer
set search_path = public
language plpgsql
as $$
declare
  v_ids uuid[];
begin
  select coalesce(array_agg(id), array[]::uuid[]) into v_ids
  from public.rooms
  where status = 'waiting'
    and created_at < now() - interval '2 hours';

  if p_dry_run then
    return query select array_length(v_ids, 1)::bigint, 0::bigint, v_ids;
  end if;

  if array_length(v_ids, 1) > 0 then
    delete from public.rooms where id = any(v_ids);
  end if;

  return query select array_length(v_ids, 1)::bigint, array_length(v_ids, 1)::bigint, v_ids;
end;
$$;
