-- Mission 32.1 — allow the public, read-only Leaderboard page to call the
-- SECURITY DEFINER aggregate without opening any underlying table access.
--
-- The page intentionally does not create an Auth session merely to display
-- public ranking fields, so PostgREST executes its RPC call as `anon`.
-- 20260718_global_leaderboard.sql granted EXECUTE only to `authenticated`,
-- which produced PostgreSQL 42501 for signed-out visitors. Authenticated
-- anonymous players already succeeded and must continue to do so.
--
-- This migration changes function ACLs only. It does not alter the function
-- body, owner, SECURITY DEFINER mode, scoring, tables, or RLS policies.

begin;

do $$
declare
  leaderboard regprocedure := to_regprocedure(
    'public.get_leaderboard(text,text,text,integer,integer,uuid)'
  );
begin
  if leaderboard is null then
    raise exception 'Expected public.get_leaderboard function is missing';
  end if;

  if not (select prosecdef from pg_proc where oid = leaderboard) then
    raise exception 'public.get_leaderboard must remain SECURITY DEFINER';
  end if;
end
$$;

revoke all on function public.get_leaderboard(text, text, text, int, int, uuid)
  from public;

grant execute on function public.get_leaderboard(text, text, text, int, int, uuid)
  to anon, authenticated;

commit;
