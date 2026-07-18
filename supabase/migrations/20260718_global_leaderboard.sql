-- Menorah Bible Quiz — Global Leaderboard & Ranking System (Sprint 6)
-- Additive only: no existing table, column, or RLS policy is altered or
-- dropped. Run this entire file once in the Supabase SQL Editor, after
-- 20260711_final_multiplayer.sql.
--
-- What this adds:
--   1. Two nullable, forward-compatible profile columns (church_name,
--      country_code) so the podium/table/preview can show them "when
--      available" — they are simply null until a future profile-editing
--      feature sets them, which is out of scope for this sprint.
--   2. Indexes needed to aggregate answers/room_players efficiently.
--   3. A SECURITY DEFINER RPC, public.get_leaderboard(...), that computes
--      ranking rows live from the existing profiles/rooms/room_players/
--      answers tables (no duplicate/mutable stat columns, no new writes,
--      no XP awarded here) and returns ONLY public fields. It runs with
--      elevated privileges specifically so it can rank across ALL players
--      even though profiles' own RLS restricts a normal SELECT to a row's
--      owner — the function body itself is the security boundary: it
--      never selects or returns anything beyond the explicit public
--      columns listed below (no auth metadata, no email — profiles has
--      no email column to begin with).

-- ---------------------------------------------------------------------------
-- 1. Forward-compatible public profile fields
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists church_name text,
  add column if not exists country_code text;

-- ---------------------------------------------------------------------------
-- 2. Indexes to keep the aggregation below fast as data grows
-- ---------------------------------------------------------------------------
create index if not exists idx_answers_player_id on public.answers(player_id);
create index if not exists idx_answers_submitted_at on public.answers(submitted_at);
create index if not exists idx_room_players_player_id on public.room_players(player_id);
create index if not exists idx_rooms_status on public.rooms(status);

-- ---------------------------------------------------------------------------
-- 3. Ranking RPC
-- ---------------------------------------------------------------------------
-- p_metric: 'total_xp' | 'total_battle_wins' | 'accuracy_percent'
--           | 'total_correct_answers' | 'current_win_streak'
--           | 'average_response_ms'
-- p_window: 'all_time' | 'weekly' | 'monthly'
--           (only affects total_xp — see window_points below — and any
--           metric derived from answers/rooms, all of which are scoped to
--           the window via submitted_at / room created_at)
-- p_player_id: when provided, ignores search/limit/offset and returns just
--           that one player's row, with their real rank computed against
--           the full ranked set (used for the "current player" summary).
create or replace function public.get_leaderboard(
  p_metric text default 'total_xp',
  p_window text default 'all_time',
  p_search text default null,
  p_limit int default 50,
  p_offset int default 0,
  p_player_id uuid default null
)
returns table (
  player_id uuid,
  display_name text,
  avatar text,
  church_name text,
  country_code text,
  player_level int,
  campaign_level int,
  total_xp int,
  total_coins int,
  total_battle_wins bigint,
  total_correct_answers bigint,
  total_answers bigint,
  accuracy_percent numeric,
  current_win_streak int,
  best_win_streak int,
  average_response_ms numeric,
  window_points bigint,
  favorite_category_id text,
  rank bigint,
  total_count bigint
)
security definer
set search_path = public
language sql
stable
as $$
  with window_bounds as (
    select case p_window
      when 'weekly' then now() - interval '7 days'
      when 'monthly' then now() - interval '30 days'
      else '-infinity'::timestamptz
    end as since
  ),
  battle_results as (
    -- One row per (finished room, player), with whether that player had
    -- the top score in that room (ties all count as a win).
    select
      rp.player_id,
      r.id as room_id,
      r.created_at,
      (rp.score = max(rp.score) over (partition by rp.room_id)) as is_win
    from public.room_players rp
    join public.rooms r on r.id = rp.room_id
    cross join window_bounds w
    where r.status = 'finished'
      and r.created_at >= w.since
  ),
  streak_source as (
    select
      player_id, is_win, created_at,
      row_number() over (partition by player_id order by created_at)
        - row_number() over (partition by player_id, is_win order by created_at) as island_id
    from battle_results
  ),
  islands as (
    select player_id, is_win, count(*) as streak_len, max(created_at) as island_end
    from streak_source
    group by player_id, is_win, island_id
  ),
  best_streaks as (
    select player_id, coalesce(max(streak_len) filter (where is_win), 0)::int as best_win_streak
    from islands
    group by player_id
  ),
  current_streaks as (
    select distinct on (player_id)
      player_id,
      (case when is_win then streak_len else 0 end)::int as current_win_streak
    from islands
    order by player_id, island_end desc
  ),
  win_counts as (
    select player_id, count(*) filter (where is_win) as total_battle_wins
    from battle_results
    group by player_id
  ),
  answer_stats as (
    select
      a.player_id,
      count(*) as total_answers,
      count(*) filter (where a.is_correct) as total_correct_answers,
      round(100.0 * count(*) filter (where a.is_correct) / nullif(count(*), 0), 1) as accuracy_percent,
      round(avg(a.response_time_ms), 0) as average_response_ms
    from public.answers a
    cross join window_bounds w
    where a.submitted_at >= w.since
    group by a.player_id
  ),
  windowed_points as (
    select a.player_id, sum(a.points_awarded) as pts
    from public.answers a
    cross join window_bounds w
    where a.submitted_at >= w.since
    group by a.player_id
  ),
  favorite_category as (
    -- Most-played category, derived from room_questions -> questions via
    -- the rooms this player has actually battled in (real data, no guess).
    select distinct on (rp.player_id)
      rp.player_id,
      r.category_id as favorite_category_id,
      count(*) as plays
    from public.room_players rp
    join public.rooms r on r.id = rp.room_id
    group by rp.player_id, r.category_id
    order by rp.player_id, count(*) desc
  ),
  base as (
    select
      p.id as player_id,
      p.display_name,
      p.avatar,
      p.church_name,
      p.country_code,
      p.player_level,
      p.campaign_level,
      p.xp as total_xp,
      p.coins as total_coins,
      coalesce(wc.total_battle_wins, 0) as total_battle_wins,
      coalesce(a.total_correct_answers, 0) as total_correct_answers,
      coalesce(a.total_answers, 0) as total_answers,
      coalesce(a.accuracy_percent, 0) as accuracy_percent,
      coalesce(cs.current_win_streak, 0) as current_win_streak,
      coalesce(bs.best_win_streak, 0) as best_win_streak,
      coalesce(a.average_response_ms, 0) as average_response_ms,
      coalesce(wp.pts, 0) as window_points,
      fc.favorite_category_id
    from public.profiles p
    left join win_counts wc on wc.player_id = p.id
    left join answer_stats a on a.player_id = p.id
    left join current_streaks cs on cs.player_id = p.id
    left join best_streaks bs on bs.player_id = p.id
    left join windowed_points wp on wp.player_id = p.id
    left join favorite_category fc on fc.player_id = p.id
  ),
  scored as (
    select
      base.*,
      (case p_metric
        when 'total_xp' then
          case when p_window = 'all_time' then total_xp::numeric else window_points::numeric end
        when 'total_battle_wins' then total_battle_wins::numeric
        when 'accuracy_percent' then accuracy_percent::numeric
        when 'total_correct_answers' then total_correct_answers::numeric
        when 'current_win_streak' then current_win_streak::numeric
        when 'average_response_ms' then
          case when average_response_ms > 0 then -average_response_ms else -999999999 end
        else total_xp::numeric
      end) as sort_key
    from base
  ),
  ranked as (
    select
      scored.*,
      rank() over (order by sort_key desc, player_id) as rank,
      count(*) over () as total_count
    from scored
  )
  select
    player_id, display_name, avatar, church_name, country_code, player_level,
    campaign_level, total_xp, total_coins, total_battle_wins,
    total_correct_answers, total_answers, accuracy_percent, current_win_streak,
    best_win_streak, average_response_ms, window_points, favorite_category_id,
    rank, total_count
  from ranked
  where (p_player_id is null or player_id = p_player_id)
    and (p_search is null or p_search = '' or
         display_name ilike '%' || p_search || '%' or
         coalesce(church_name, '') ilike '%' || p_search || '%')
  order by rank asc
  limit case when p_player_id is not null then 1 else greatest(0, least(p_limit, 200)) end
  offset case when p_player_id is not null then 0 else greatest(0, p_offset) end;
$$;

revoke all on function public.get_leaderboard(text, text, text, int, int, uuid) from public;
grant execute on function public.get_leaderboard(text, text, text, int, int, uuid) to authenticated;
