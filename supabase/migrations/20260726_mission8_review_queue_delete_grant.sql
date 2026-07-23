-- Mission 8 — Review Queue "Delete Selected" bulk action.
--
-- 20260725_mission7_admin_grants_hotfix.sql deliberately granted
-- service_role only SELECT/INSERT/UPDATE (no DELETE) on
-- admin_imported_questions and question_review_overlay, because at the
-- time nothing in the app ever deleted a row from either table.
--
-- lib/admin/reviewStore.ts now adds bulkDeleteImportedQuestions(), which
-- lets an admin permanently remove AI-imported draft questions (never the
-- static canonical bank in lib/questions/* — see that function's doc
-- comment for the exact safety scoping). That needs an actual DELETE
-- grant for service_role on these two tables, or every call fails with
-- "permission denied" the same way admin_imported_questions reads did
-- before the Mission 7 hotfix.
--
-- question_review_history is intentionally NOT touched here — it stays
-- append-only (SELECT/INSERT only, no UPDATE/DELETE for any role), by
-- design, so the audit trail survives even a deletion of the question it
-- refers to.
--
-- Idempotent: safe to run more than once.

grant delete on public.admin_imported_questions to service_role;
grant delete on public.question_review_overlay to service_role;
