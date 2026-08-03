# Supabase Production Audit

This audit was non-mutating. No migrations were applied, no users or rooms were created, and no record contents or credentials were printed.

## Repository migration comparison

| Repository migration | Production evidence | Action required |
|---|---|---|
| `20260711_final_multiplayer.sql` | Core table endpoints are present but returned 403 to the configured server credential | Verify grants/RLS and linked-project identity before release |
| `20260718_global_leaderboard.sql` | Exact `get_leaderboard` call returned 403 / `42501` | **Critical: repair verified production execute/grant path; do not rerun blindly** |
| `20260719_online_live_battle.sql` | RPC behavior not mutation-tested | Compare migration ledger and run authenticated staging/production smoke test |
| `20260722_mission4_fixes.sql` | RPC behavior not mutation-tested | Compare migration ledger |
| `20260723_mission7_admin_platform.sql` | Admin table endpoints present | Confirm ledger entry and policies |
| `20260724_mission7_data_retention.sql` | Cleanup RPC was intentionally not invoked | Confirm scheduled/manual retention policy and ledger entry |
| `20260725_mission7_admin_grants_hotfix.sql` | Admin endpoints reachable with server credential | Confirm ledger entry |
| `20260726_mission8_review_queue_delete_grant.sql` | Object presence inferred from reachable admin tables | Confirm ledger entry |
| `20260727_mission8_factory_reject_reason.sql` | Questions endpoint present | Confirm column/function via migration ledger |
| `20260728_mission8_factory_bulk_delete_grant.sql` | Not mutation-tested | Confirm ledger entry |
| `20260729_mission9_editorial_publish_bridge.sql` | Not invoked; publishing is mutating | Confirm function and ledger entry |
| `20260730_mission10_translation_workflow.sql` | Translation history endpoint present | Confirm ledger entry |
| `20260731_mission11_publish_bridge_translation_status_fix.sql` | Not invoked; publishing is mutating | Confirm ledger entry |
| `20260803_mission13_per_player_language.sql` | Not invoked; changes player state | Confirm ledger entry |

The official CLI was run in migration-list mode only, but no ledger was returned because usable linked-project CLI authentication/database access was unavailable. This is not evidence that migrations are synchronized.

## Read-only results

- Supabase Auth admin endpoint was reachable and at least one auth user exists.
- Existence of a production administrator in `admin_users`, and successful admin login, remain unverified without owner credentials.
- Admin/review/import/settings/translation tables are present.
- `get_leaderboard` failed with PostgreSQL permission code `42501`, including with its exact repository signature.
- Anonymous auth was not tested because doing so would create a production auth user.
- Live Battle room lifecycle was not tested because it creates and changes production records.
- RLS definitions are present in repository migrations, but live policy parity requires SQL/CLI dashboard access.
- Code audit confirms the client uses only the public Supabase publishable key; the service-role key is accessed by server-only modules/routes and is not prefixed `NEXT_PUBLIC_`.

## Owner actions

1. Use the production Supabase dashboard/CLI to compare `supabase_migrations.schema_migrations` with every repository file above.
2. Diagnose `get_leaderboard` as an authenticated anonymous player; confirm the expected `authenticated` execute grant and underlying access.
3. Verify anonymous sign-in is enabled.
4. Inspect live RLS policies/grants for multiplayer and admin tables.
5. Confirm the intended production admin user has an `admin_users` row and can log in.
6. Run a controlled create/join/play/finish room smoke test, then clean up only the records created by that test.
7. Confirm no mock-data banner appears on production.
