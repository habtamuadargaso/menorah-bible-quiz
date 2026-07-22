import type { BibleQuestion } from "@/lib/questions/types";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { AdminReviewStateFile, AdminSettings, QuestionOverlay, ReviewStatus } from "./types";
import { DEFAULT_ADMIN_SETTINGS } from "./types";

/**
 * Mission 7 Part 4: this used to be JSON files under data/admin/, which do
 * not survive on a serverless deployment target (no persistent writable
 * filesystem, no sharing across instances) — see the migration file
 * supabase/migrations/20260723_mission7_admin_platform.sql and
 * scripts/migrate-admin-json-to-supabase.mjs for the one-time move.
 *
 * All reads/writes here use the service-role client, which bypasses RLS.
 * That is safe ONLY because every caller of these functions is itself
 * reached exclusively through routes gated by isAuthorizedAdmin() —
 * authorization is enforced at the API-route layer, not by RLS, for this
 * particular set of tables. RLS is still enabled on all four tables so
 * they are not silently world-readable if ever queried with the anon key.
 */

function emptyOverlay(): QuestionOverlay {
  return {
    review: { status: "draft", reviewer: null, reviewedAt: null, reason: null },
    edits: {},
    history: [],
  };
}

type OverlayRow = {
  question_id: string;
  status: ReviewStatus;
  reviewer: string | null;
  reviewed_at: string | null;
  reason: string | null;
  edits: QuestionOverlay["edits"];
};

type HistoryRow = {
  question_id: string;
  at: string;
  reviewer: string | null;
  action: string;
  detail: string | null;
};

export async function loadReviewState(): Promise<AdminReviewStateFile> {
  const supabase = createServiceRoleClient();

  const [{ data: overlayRows, error: overlayError }, { data: historyRows, error: historyError }] = await Promise.all([
    supabase.from("question_review_overlay").select("question_id, status, reviewer, reviewed_at, reason, edits"),
    supabase.from("question_review_history").select("question_id, at, reviewer, action, detail").order("at", { ascending: true }),
  ]);

  if (overlayError) throw new Error(overlayError.message);
  if (historyError) throw new Error(historyError.message);

  const historyByQuestion = new Map<string, QuestionOverlay["history"]>();
  for (const row of (historyRows ?? []) as HistoryRow[]) {
    const list = historyByQuestion.get(row.question_id) ?? [];
    list.push({ at: row.at, reviewer: row.reviewer, action: row.action, detail: row.detail ?? undefined });
    historyByQuestion.set(row.question_id, list);
  }

  const state: AdminReviewStateFile = {};
  for (const row of (overlayRows ?? []) as OverlayRow[]) {
    state[row.question_id] = {
      review: { status: row.status, reviewer: row.reviewer, reviewedAt: row.reviewed_at, reason: row.reason },
      edits: row.edits ?? {},
      history: historyByQuestion.get(row.question_id) ?? [],
    };
  }
  return state;
}

async function appendHistory(
  supabase: ReturnType<typeof createServiceRoleClient>,
  questionId: string,
  reviewer: string | null,
  action: string,
  detail?: string
): Promise<void> {
  const { error } = await supabase
    .from("question_review_history")
    .insert({ question_id: questionId, reviewer, action, detail: detail ?? null });
  if (error) throw new Error(error.message);
}

export async function getOverlay(questionId: string): Promise<QuestionOverlay> {
  const state = await loadReviewState();
  return state[questionId] ?? emptyOverlay();
}

/** Sets review status. Never called automatically for AI-generated
 * content — every call here is the direct result of an explicit admin
 * action in the dashboard (see Part 9's "never auto-approve" rule). */
export async function setReviewStatus(
  questionId: string,
  status: ReviewStatus,
  reviewer: string,
  reason?: string
): Promise<QuestionOverlay> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from("question_review_overlay").upsert({
    question_id: questionId,
    status,
    reviewer,
    reviewed_at: now,
    reason: reason ?? null,
    updated_at: now,
  });
  if (error) throw new Error(error.message);

  await appendHistory(supabase, questionId, reviewer, `status -> ${status}`, reason);
  return getOverlay(questionId);
}

export async function applyEdit(
  questionId: string,
  patch: QuestionOverlay["edits"],
  reviewer: string
): Promise<QuestionOverlay> {
  const supabase = createServiceRoleClient();
  const existing = await getOverlay(questionId);
  const now = new Date().toISOString();
  const nextEdits = { ...existing.edits, ...patch };

  // An edit resets an approved/published/rejected question back to
  // needs-review — content changed, so the prior review decision no
  // longer applies to what a player would actually see.
  const resetStatuses: ReviewStatus[] = ["approved", "published", "rejected"];
  const nextStatus: ReviewStatus = resetStatuses.includes(existing.review.status) ? "needs-review" : existing.review.status;
  const nextReason = resetStatuses.includes(existing.review.status) ? "Content edited — re-review required" : existing.review.reason;

  const { error } = await supabase.from("question_review_overlay").upsert({
    question_id: questionId,
    status: nextStatus,
    reviewer,
    reviewed_at: now,
    reason: nextReason,
    edits: nextEdits,
    updated_at: now,
  });
  if (error) throw new Error(error.message);

  await appendHistory(supabase, questionId, reviewer, "edited", Object.keys(patch).join(", "));
  return getOverlay(questionId);
}

export async function bulkSetReviewStatus(
  questionIds: string[],
  status: ReviewStatus,
  reviewer: string,
  reason?: string
): Promise<void> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from("question_review_overlay").upsert(
    questionIds.map((id) => ({
      question_id: id,
      status,
      reviewer,
      reviewed_at: now,
      reason: reason ?? null,
      updated_at: now,
    }))
  );
  if (error) throw new Error(error.message);

  const { error: historyError } = await supabase.from("question_review_history").insert(
    questionIds.map((id) => ({ question_id: id, reviewer, action: `bulk status -> ${status}`, detail: reason ?? null }))
  );
  if (historyError) throw new Error(historyError.message);
}

export async function bulkAddTag(questionIds: string[], tag: string, reviewer: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  for (const id of questionIds) {
    const existing = await getOverlay(id);
    const existingTags = existing.edits.tags ?? [];
    const nextTags = existingTags.includes(tag) ? existingTags : [...existingTags, tag];
    const { error } = await supabase.from("question_review_overlay").upsert({
      question_id: id,
      status: existing.review.status,
      reviewer: existing.review.reviewer,
      reviewed_at: existing.review.reviewedAt,
      reason: existing.review.reason,
      edits: { ...existing.edits, tags: nextTags },
      updated_at: now,
    });
    if (error) throw new Error(error.message);
    await appendHistory(supabase, id, reviewer, "bulk tag added", tag);
  }
}

export async function bulkSetCategory(questionIds: string[], category: string, reviewer: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  for (const id of questionIds) {
    const existing = await getOverlay(id);
    const { error } = await supabase.from("question_review_overlay").upsert({
      question_id: id,
      status: existing.review.status,
      reviewer: existing.review.reviewer,
      reviewed_at: existing.review.reviewedAt,
      reason: existing.review.reason,
      edits: { ...existing.edits, canonicalCategory: category as QuestionOverlay["edits"]["canonicalCategory"] },
      updated_at: now,
    });
    if (error) throw new Error(error.message);
    await appendHistory(supabase, id, reviewer, "bulk category change", category);
  }
}

/**
 * Accepted-by-the-importer questions, persisted separately from the
 * compiled canonical store (lib/questions/store.ts is static TS data —
 * there's no way to append to it at runtime without a rebuild). Merged in
 * by adminQuestions.ts alongside the canonical set. Every question landed
 * here keeps whatever verified/review status it's given at merge time —
 * see the import route, which forces verified:false and status:"draft"
 * regardless of what the imported JSON claims (Part 12: never
 * auto-publish imported questions).
 */
export async function loadImportedQuestions(): Promise<BibleQuestion[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("admin_imported_questions").select("payload").order("imported_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.payload as BibleQuestion);
}

export async function appendImportedQuestions(questions: BibleQuestion[]): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("admin_imported_questions").upsert(
    questions.map((q) => ({ question_id: q.id, payload: q })),
    { onConflict: "question_id" }
  );
  if (error) throw new Error(error.message);
}

export async function loadAdminSettings(): Promise<AdminSettings> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("admin_settings").select("settings").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return DEFAULT_ADMIN_SETTINGS;
  return { ...DEFAULT_ADMIN_SETTINGS, ...(data.settings as Partial<AdminSettings>) };
}

export async function saveAdminSettings(settings: AdminSettings): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("admin_settings").upsert({ id: 1, settings, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}
