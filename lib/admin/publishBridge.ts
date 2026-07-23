import { createServiceRoleClient } from "@/lib/supabase/server";
import { normalizeText } from "@/lib/question-factory/database";
import { getAdminQuestionById } from "./adminQuestions";
import type { EditorialSourceType, PublishOutcome, PublishResult } from "./types";

type SupabaseServiceClient = ReturnType<typeof createServiceRoleClient>;

async function appendHistoryBatch(
  supabase: SupabaseServiceClient,
  entries: Array<{ questionId: string; reviewer: string; action: string; detail?: string | null }>
): Promise<void> {
  if (entries.length === 0) return;
  const { error } = await supabase
    .from("question_review_history")
    .insert(entries.map((e) => ({ question_id: e.questionId, reviewer: e.reviewer, action: e.action, detail: e.detail ?? null })));
  // Audit logging must never block the actual publish outcome from being
  // returned to the caller — same "non-fatal" precedent Mission 8 set for
  // the AI Factory's own audit logging.
  if (error) console.error("Failed to write question_review_history for editorial publish:", error.message);
}

async function resolveSourceType(supabase: SupabaseServiceClient, questionId: string): Promise<EditorialSourceType> {
  const { data } = await supabase.from("admin_imported_questions").select("question_id").eq("question_id", questionId).maybeSingle();
  return data ? "imported" : "canonical";
}

/**
 * Secondary duplicate signal (requirement 10) — source mapping (the
 * unique index in the Mission 9 migration, checked inside the RPC itself)
 * is the authoritative idempotency key; this is a warning/skip mechanism
 * on top of it, catching the case where a live row with matching content
 * already exists under a DIFFERENT (or no) source mapping. Excludes any
 * row already mapped to this exact source id, since that case is
 * "already_live," not a duplicate.
 */
async function findContentDuplicate(
  supabase: SupabaseServiceClient,
  questionId: string,
  level: number,
  reference: string,
  normalizedEnglish: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("questions")
    .select("id, source_question_id, question_translations!inner(question_text, language_code)")
    .eq("level", level)
    .eq("reference", reference)
    .eq("question_translations.language_code", "en");
  if (error) throw new Error(error.message);

  for (const row of (data ?? []) as Array<{
    id: string;
    source_question_id: string | null;
    question_translations: Array<{ question_text: string }>;
  }>) {
    if (row.source_question_id === questionId) continue;
    const text = row.question_translations[0]?.question_text;
    if (text && normalizeText(text) === normalizedEnglish) return row.id;
  }
  return null;
}

async function publishOne(supabase: SupabaseServiceClient, questionId: string, reviewer: string): Promise<PublishResult> {
  const question = await getAdminQuestionById(questionId);
  if (!question) {
    return { questionId, outcome: "ineligible", detail: "Question not found." };
  }

  // Blocks draft / needs-review / rejected / archived (requirement 2).
  if (question.review.status !== "approved") {
    return { questionId, outcome: "ineligible", detail: `Status is "${question.review.status}", not "approved".` };
  }
  // Blocks invalid content even if it was somehow marked approved.
  if (question.validation.errorCount > 0) {
    return {
      questionId,
      outcome: "ineligible",
      detail: `${question.validation.errorCount} validation error(s) must be fixed before publishing.`,
    };
  }

  const en = question.translations.en;
  const hasCompleteEnglish = Boolean(
    en && en.question.trim() && en.choices.length === 4 && en.choices.every((c) => c.trim()) && en.explanation.trim()
  );
  if (!hasCompleteEnglish) {
    return {
      questionId,
      outcome: "ineligible",
      detail: "English translation is missing or incomplete (needs question text, 4 choices, and an explanation).",
    };
  }

  const normalizedEnglish = normalizeText(en!.question);
  const duplicateId = await findContentDuplicate(supabase, questionId, question.level, question.reference, normalizedEnglish);
  if (duplicateId) {
    return {
      questionId,
      outcome: "skipped_duplicate",
      detail: `A live question with matching text, reference, and level already exists (${duplicateId}).`,
      liveQuestionId: duplicateId,
    };
  }

  const translations: Array<{
    language_code: string;
    question_text: string;
    choice_1: string;
    choice_2: string;
    choice_3: string;
    choice_4: string;
    explanation: string;
    reflection: null;
  }> = [];
  for (const [languageCode, t] of Object.entries(question.translations)) {
    if (!t) continue;
    if (!t.question.trim() || t.choices.length !== 4 || t.choices.some((c) => !c.trim()) || !t.explanation.trim()) continue;
    translations.push({
      language_code: languageCode,
      question_text: t.question.trim(),
      choice_1: t.choices[0].trim(),
      choice_2: t.choices[1].trim(),
      choice_3: t.choices[2].trim(),
      choice_4: t.choices[3].trim(),
      explanation: t.explanation.trim(),
      reflection: null,
    });
  }

  const sourceType = await resolveSourceType(supabase, questionId);

  const { data, error } = await supabase.rpc("publish_editorial_question", {
    p_source_type: sourceType,
    p_source_question_id: questionId,
    p_level: question.level,
    p_category: question.canonicalCategory,
    p_book: question.book,
    p_chapter: question.chapter ?? null,
    p_difficulty: question.difficulty,
    p_correct_index: question.correctIndex,
    p_reference: question.reference,
    p_translations: translations,
    p_reviewer: reviewer,
    p_source_category: question.category || null,
    p_source_tags: question.tags.length > 0 ? question.tags : null,
  });

  if (error) {
    return { questionId, outcome: "failed", detail: error.message };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { questionId, outcome: "failed", detail: "Publish function returned no result." };
  }
  return {
    questionId,
    outcome: row.outcome as PublishOutcome,
    liveQuestionId: row.live_question_id ?? undefined,
  };
}

/**
 * The Mission 9 editorial-to-live publishing bridge (requirement 2).
 * Converts each eligible (status='approved', zero validation errors,
 * complete English translation) editorial question into a
 * public.questions row via publish_editorial_question() — supabase/
 * migrations/20260729_mission9_editorial_publish_bridge.sql — which
 * performs the live-row insert, translations insert, and overlay status
 * update atomically. Everything before that RPC call is a side-effect-
 * free read (loading the current editorial record, checking eligibility,
 * checking for a content duplicate), so there's nothing to roll back if
 * it fails partway — only the RPC's own write needs transactional safety,
 * and that's where it lives.
 *
 * Never trusts anything from the browser except which ids to attempt
 * (requirements 5 and 13) — every field written to public.questions is
 * re-read fresh, server-side, from the editorial store (canonical bank +
 * admin_imported_questions + question_review_overlay) for each id, never
 * accepted from the request body.
 */
export async function publishEditorialQuestions(questionIds: string[], reviewer: string): Promise<PublishResult[]> {
  if (questionIds.length === 0) return [];
  const supabase = createServiceRoleClient();

  await appendHistoryBatch(
    supabase,
    questionIds.map((id) => ({ questionId: id, reviewer, action: "publish attempted" }))
  );

  const results: PublishResult[] = [];
  for (const questionId of questionIds) {
    results.push(await publishOne(supabase, questionId, reviewer));
  }

  await appendHistoryBatch(
    supabase,
    results.map((r) => ({ questionId: r.questionId, reviewer, action: `publish result: ${r.outcome}`, detail: r.detail }))
  );

  return results;
}
