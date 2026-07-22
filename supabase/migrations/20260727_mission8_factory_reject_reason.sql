-- Mission 8 — AI Factory reject-reason audit column.
--
-- /api/admin/factory-review is the review gate for the `questions` table
-- that live multiplayer rooms actually select from (start_battle() in
-- 20260719_online_live_battle.sql only picks status='published' rows) —
-- unlike the Question Bank/Review Queue's overlay system, this table has
-- no append-only history table backing it at all, so a rejection reason
-- had nowhere to be stored. The dashboard now requires a reason before
-- rejecting a factory-generated question (matching the same requirement
-- everywhere else in the admin platform); this column is where it's kept.
--
-- Idempotent: `add column if not exists`, safe to run more than once.
-- No RLS/grant change needed — this column is covered by the table's
-- existing policies and grants.

alter table public.questions add column if not exists rejected_reason text;
