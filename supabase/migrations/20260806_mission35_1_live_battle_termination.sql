-- Mission 35.1 — explicit, realtime-visible Live Battle termination.
-- Ended rooms remain readable briefly so every subscribed player can render
-- the terminal reason; the existing stale-room cleanup then removes them.

alter table public.rooms drop constraint if exists rooms_status_check;
alter table public.rooms add constraint rooms_status_check
  check (status in ('waiting', 'countdown', 'question', 'reveal', 'leaderboard', 'finished', 'ended'));

alter table public.rooms add column if not exists ended_reason text;
alter table public.rooms add column if not exists ended_at timestamptz;

alter table public.rooms drop constraint if exists rooms_ended_reason_check;
alter table public.rooms add constraint rooms_ended_reason_check
  check (ended_reason is null or ended_reason in ('host_ended', 'host_disconnected'));

-- Explicit host-only UPDATE protection for the direct PostgREST transition.
-- Authenticated users retain UPDATE capability at the grant layer, but RLS
-- limits both the old row and the resulting row to rooms they host. Anonymous
-- unauthenticated callers receive no table UPDATE grant.
revoke update on table public.rooms from anon;
grant update on table public.rooms to authenticated;

drop policy if exists "Hosts can update rooms" on public.rooms;
create policy "Hosts can update rooms" on public.rooms
  for update to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

-- Any room member may request this check, but the database ends the room
-- only after the host heartbeat has been absent for the full grace period.
create or replace function public.end_battle_if_host_disconnected(
  p_room_id uuid,
  p_grace_seconds int default 30
)
returns boolean
security definer
set search_path = public
language plpgsql
as $$
declare
  v_room record;
  v_host_last_seen timestamptz;
begin
  if p_grace_seconds < 20 or p_grace_seconds > 300 then
    raise exception 'Invalid reconnect grace period';
  end if;

  select * into v_room from public.rooms where id = p_room_id for update;
  if not found or v_room.status in ('ended', 'finished') then
    return false;
  end if;
  if not exists (
    select 1 from public.room_players
    where room_id = p_room_id and player_id = auth.uid()
  ) then
    raise exception 'You are not a member of this room';
  end if;

  select last_seen_at into v_host_last_seen from public.room_players
  where room_id = p_room_id and player_id = v_room.host_id;

  if v_host_last_seen is null or v_host_last_seen > now() - make_interval(secs => p_grace_seconds) then
    return false;
  end if;

  update public.rooms set
    status = 'ended',
    ended_reason = 'host_disconnected',
    ended_at = now(),
    question_started_at = null,
    question_ends_at = null,
    phase_ends_at = null
  where id = p_room_id and status not in ('ended', 'finished');
  return found;
end;
$$;

revoke all on function public.end_battle_if_host_disconnected(uuid, int) from public;
grant execute on function public.end_battle_if_host_disconnected(uuid, int) to authenticated;

-- Preserve finished rooms for leaderboard history. Ended rooms produce no
-- leaderboard rewards and may be removed with abandoned waiting rooms.
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
  where (status = 'waiting' and created_at < now() - interval '2 hours')
     or (status = 'ended' and ended_at < now() - interval '2 hours');

  if p_dry_run then
    return query select cardinality(v_ids)::bigint, 0::bigint, v_ids;
  end if;
  if cardinality(v_ids) > 0 then
    delete from public.rooms where id = any(v_ids);
  end if;
  return query select cardinality(v_ids)::bigint, cardinality(v_ids)::bigint, v_ids;
end;
$$;
