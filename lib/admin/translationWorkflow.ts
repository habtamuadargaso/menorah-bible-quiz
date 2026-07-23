import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateWithGemini, parseGeminiJson, getGeminiModel } from "@/lib/question-factory/gemini";
import { LANGUAGES } from "@/lib/i18n/locales";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

const SUPPORTED_LANGUAGE_CODES = new Set<string>(LANGUAGES.map((l) => l.code));

/**
 * Mission 10 — the server-side translation workflow, mirroring the
 * pattern lib/admin/publishBridge.ts established in Mission 9: never trust
 * content from the browser, re-verify eligibility server-side at write
 * time, log an append-only history entry for every attempt and its
 * result, and never let a published row disappear or get silently
 * overwritten just because a bulk action ran.
 */

export type TranslationOutcome =
  | "generated"
  | "already_exists"
  | "skipped_published"
  | "missing_source"
  | "invalid_source"
  | "unsupported_language"
  | "failed";

export interface GenerateResult {
  questionId: string;
  targetLanguage: string;
  outcome: TranslationOutcome;
  detail?: string;
  translationId?: string;
}

export type ReviewOutcome = "approved" | "rejected" | "published" | "archived" | "edited" | "ineligible" | "failed";

export interface ReviewResult {
  translationId: string;
  outcome: ReviewOutcome;
  detail?: string;
}

interface HistoryEntry {
  questionId: string;
  languageCode: string;
  actor: string;
  action: string;
  detail?: unknown;
}

async function logHistoryBatch(supabase: ServiceClient, entries: HistoryEntry[]): Promise<void> {
  if (entries.length === 0) return;
  const { error } = await supabase.from("translation_review_history").insert(
    entries.map((e) => ({
      question_id: e.questionId,
      language_code: e.languageCode,
      actor: e.actor,
      action: e.action,
      detail: e.detail ?? null,
    }))
  );
  // Same precedent as Missions 8/9: an audit-log hiccup must never block
  // the actual workflow action from completing or being reported back.
  if (error) console.error("Failed to write translation_review_history:", error.message);
}

function buildTranslationPrompt(
  source: {
    question: string;
    choice1: string;
    choice2: string;
    choice3: string;
    choice4: string;
    explanation: string;
    reflection: string | null;
    reference: string;
  },
  targetLanguageName: string
): string {
  return `
Translate the following Bible quiz question from English into ${targetLanguageName}.

STRICT RULES
1. Preserve the exact meaning of the question — do not add or remove facts.
2. Preserve all four answer choices in the SAME ORDER as given. Do not reorder, merge, add, or remove choices — translate each one faithfully in its own position. (You are not told which choice is correct; keeping the order intact is what preserves the correct answer's position.)
3. Do not change the Bible reference "${source.reference}" — keep it exactly as given, or use the standard ${targetLanguageName}-language convention for the SAME reference if one is well established; never invent a different verse.
4. Preserve the explanation's meaning.
5. ${source.reflection ? "Preserve the reflection's meaning." : "There is no reflection for this question — return null for reflection."}
6. Use natural, fluent wording a native ${targetLanguageName} speaker would recognize.
7. Return JSON only — no Markdown code fences, no commentary.

SOURCE (English)
${JSON.stringify(
  {
    question: source.question,
    choice_1: source.choice1,
    choice_2: source.choice2,
    choice_3: source.choice3,
    choice_4: source.choice4,
    explanation: source.explanation,
    reflection: source.reflection,
  },
  null,
  2
)}

Return this exact JSON structure:
{
  "question_text": "translated question",
  "choice_1": "translated choice 1",
  "choice_2": "translated choice 2",
  "choice_3": "translated choice 3",
  "choice_4": "translated choice 4",
  "explanation": "translated explanation",
  "reflection": "translated reflection, or null if there is none"
}
`;
}

type TranslatedPayload = {
  question_text?: string;
  choice_1?: string;
  choice_2?: string;
  choice_3?: string;
  choice_4?: string;
  explanation?: string;
  reflection?: string | null;
};

async function generateOne(
  supabase: ServiceClient,
  questionId: string,
  targetLanguage: string,
  reviewer: string,
  sourceLanguage: string,
  forceRegenerate: boolean
): Promise<GenerateResult> {
  if (!SUPPORTED_LANGUAGE_CODES.has(targetLanguage)) {
    return { questionId, targetLanguage, outcome: "unsupported_language", detail: `"${targetLanguage}" is not a supported language code.` };
  }
  if (targetLanguage === sourceLanguage) {
    return { questionId, targetLanguage, outcome: "unsupported_language", detail: "Target language must differ from the source language." };
  }

  const { data: questionRow, error: questionError } = await supabase
    .from("questions")
    .select("reference")
    .eq("id", questionId)
    .maybeSingle();
  if (questionError) return { questionId, targetLanguage, outcome: "failed", detail: questionError.message };
  if (!questionRow) return { questionId, targetLanguage, outcome: "missing_source", detail: "Parent question not found in public.questions." };

  // Only translate from an approved or published source — never from a
  // rejected, ai_draft, or needs_review row (requirement: "never translate
  // from a rejected or incomplete translation").
  const { data: sourceRow, error: sourceError } = await supabase
    .from("question_translations")
    .select("question_text, choice_1, choice_2, choice_3, choice_4, explanation, reflection, status")
    .eq("question_id", questionId)
    .eq("language_code", sourceLanguage)
    .maybeSingle();
  if (sourceError) return { questionId, targetLanguage, outcome: "failed", detail: sourceError.message };
  if (!sourceRow) return { questionId, targetLanguage, outcome: "missing_source", detail: `No ${sourceLanguage} translation exists for this question.` };
  if (sourceRow.status !== "approved" && sourceRow.status !== "published") {
    return {
      questionId,
      targetLanguage,
      outcome: "invalid_source",
      detail: `The ${sourceLanguage} source translation is "${sourceRow.status}", not approved or published.`,
    };
  }

  const { data: existing, error: existingError } = await supabase
    .from("question_translations")
    .select("id, status")
    .eq("question_id", questionId)
    .eq("language_code", targetLanguage)
    .maybeSingle();
  if (existingError) return { questionId, targetLanguage, outcome: "failed", detail: existingError.message };

  // A published translation is never overwritten by generation, force or
  // not — that's what "archive" (an explicit, separate admin action) is
  // for. This is the one rule generation can never bypass.
  if (existing?.status === "published") {
    return {
      questionId,
      targetLanguage,
      outcome: "skipped_published",
      detail: "A published translation already exists and is protected from regeneration.",
      translationId: existing.id,
    };
  }
  if (existing && !forceRegenerate) {
    return {
      questionId,
      targetLanguage,
      outcome: "already_exists",
      detail: `A "${existing.status}" translation already exists. Pass force_regenerate to replace it.`,
      translationId: existing.id,
    };
  }

  const targetInfo = LANGUAGES.find((l) => l.code === targetLanguage);
  const targetLanguageName = targetInfo?.englishName ?? targetLanguage;

  const prompt = buildTranslationPrompt(
    {
      question: sourceRow.question_text,
      choice1: sourceRow.choice_1,
      choice2: sourceRow.choice_2,
      choice3: sourceRow.choice_3,
      choice4: sourceRow.choice_4,
      explanation: sourceRow.explanation,
      reflection: sourceRow.reflection,
      reference: questionRow.reference,
    },
    targetLanguageName
  );

  let translated: TranslatedPayload;
  try {
    const responseText = await generateWithGemini(prompt, { temperature: 0.3, topP: 0.9, responseMimeType: "application/json" });
    translated = parseGeminiJson<TranslatedPayload>(responseText);
  } catch (err) {
    return { questionId, targetLanguage, outcome: "failed", detail: err instanceof Error ? err.message : "AI translation call failed." };
  }

  const choices = [translated.choice_1, translated.choice_2, translated.choice_3, translated.choice_4];
  if (!translated.question_text?.trim() || choices.some((c) => !c?.trim()) || !translated.explanation?.trim()) {
    return { questionId, targetLanguage, outcome: "failed", detail: "AI response was missing required fields (question, 4 choices, explanation)." };
  }
  const normalized = choices.map((c) => c!.trim().toLowerCase());
  if (new Set(normalized).size !== 4) {
    return { questionId, targetLanguage, outcome: "failed", detail: "AI response had duplicate answer choices." };
  }

  const nowIso = new Date().toISOString();
  const row = {
    question_text: translated.question_text!.trim(),
    choice_1: translated.choice_1!.trim(),
    choice_2: translated.choice_2!.trim(),
    choice_3: translated.choice_3!.trim(),
    choice_4: translated.choice_4!.trim(),
    explanation: translated.explanation!.trim(),
    reflection: translated.reflection?.trim() || null,
    status: "ai_draft",
    source_language: sourceLanguage,
    translation_provider: "gemini",
    ai_model: getGeminiModel(),
    generated_at: nowIso,
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
    quality_score: null, // never fabricated — Gemini's text API returns no confidence signal
    published_at: null,
    updated_at: nowIso,
  };

  if (existing) {
    // WHERE-guarded update, not a blanket upsert: if the row somehow
    // became published between our check above and this statement (a
    // narrow concurrent-request race), this affects zero rows rather than
    // clobbering live content — detected via the empty .select() result.
    const { data: updated, error: updateError } = await supabase
      .from("question_translations")
      .update(row)
      .eq("id", existing.id)
      .neq("status", "published")
      .select("id");
    if (updateError) return { questionId, targetLanguage, outcome: "failed", detail: updateError.message };
    if (!updated || updated.length === 0) {
      return { questionId, targetLanguage, outcome: "skipped_published", detail: "Became published before this regeneration could apply.", translationId: existing.id };
    }
    return { questionId, targetLanguage, outcome: "generated", translationId: existing.id };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("question_translations")
    .insert({ question_id: questionId, language_code: targetLanguage, ...row })
    .select("id")
    .single();
  if (insertError) {
    // 23505 = unique_violation on (question_id, language_code) — another
    // request created this exact row concurrently. Idempotent per
    // requirement 8: report it the same as finding it up front.
    if (insertError.code === "23505") {
      return { questionId, targetLanguage, outcome: "already_exists", detail: "Created concurrently by another request." };
    }
    return { questionId, targetLanguage, outcome: "failed", detail: insertError.message };
  }
  return { questionId, targetLanguage, outcome: "generated", translationId: inserted.id };
}

/**
 * Bulk/single AI translation generation. Controlled batching (requirement:
 * "do not issue hundreds of AI requests simultaneously") — processes a
 * limited number of (question, language) pairs concurrently rather than
 * all at once or one at a time.
 */
export async function generateTranslations(
  pairs: Array<{ questionId: string; targetLanguage: string }>,
  reviewer: string,
  options: { forceRegenerate?: boolean; sourceLanguage?: string } = {}
): Promise<GenerateResult[]> {
  if (pairs.length === 0) return [];
  const sourceLanguage = options.sourceLanguage ?? "en";
  const forceRegenerate = options.forceRegenerate ?? false;
  const supabase = createServiceRoleClient();

  const CONCURRENCY = 3;
  const results: GenerateResult[] = [];
  for (let i = 0; i < pairs.length; i += CONCURRENCY) {
    const batch = pairs.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((pair) => generateOne(supabase, pair.questionId, pair.targetLanguage, reviewer, sourceLanguage, forceRegenerate))
    );
    results.push(...batchResults);
  }

  await logHistoryBatch(
    supabase,
    results.map((r) => ({
      questionId: r.questionId,
      languageCode: r.targetLanguage,
      actor: reviewer,
      action: `generate: ${r.outcome}`,
      detail: r.detail ? { message: r.detail } : null,
    }))
  );

  return results;
}

/** Shared status-transition core for approve/reject/publish/archive: a
 * single WHERE-guarded UPDATE per id (never a blanket write) — if the row
 * isn't currently in one of `allowedFrom`, it's reported "ineligible" and
 * left completely untouched, never force-transitioned. */
async function transitionStatus(
  supabase: ServiceClient,
  translationIds: string[],
  allowedFrom: string[],
  newStatus: string,
  reviewer: string,
  extraFields: Record<string, unknown> = {}
): Promise<ReviewResult[]> {
  const nowIso = new Date().toISOString();
  const results: ReviewResult[] = [];
  const historyEntries: HistoryEntry[] = [];

  for (const id of translationIds) {
    const { data, error } = await supabase
      .from("question_translations")
      .update({ status: newStatus, updated_at: nowIso, ...extraFields })
      .eq("id", id)
      .in("status", allowedFrom)
      .select("id, question_id, language_code")
      .maybeSingle();

    if (error) {
      results.push({ translationId: id, outcome: "failed", detail: error.message });
      continue;
    }
    if (!data) {
      results.push({ translationId: id, outcome: "ineligible", detail: `Not currently in a status this action allows (${allowedFrom.join("/")}).` });
      continue;
    }
    results.push({ translationId: id, outcome: newStatus as ReviewOutcome });
    historyEntries.push({ questionId: data.question_id, languageCode: data.language_code, actor: reviewer, action: newStatus });
  }

  await logHistoryBatch(supabase, historyEntries);
  return results;
}

export async function approveTranslations(translationIds: string[], reviewer: string): Promise<ReviewResult[]> {
  if (translationIds.length === 0) return [];
  const supabase = createServiceRoleClient();
  return transitionStatus(supabase, translationIds, ["ai_draft", "needs_review"], "approved", reviewer, {
    reviewed_by: reviewer,
    reviewed_at: new Date().toISOString(),
  });
}

export async function rejectTranslations(translationIds: string[], reviewer: string, reason: string): Promise<ReviewResult[]> {
  if (translationIds.length === 0) return [];
  const supabase = createServiceRoleClient();
  // Never rejects an already-published translation — archive is the
  // correct action to take a live translation out of rotation (mirrors
  // Mission 9's "never delete/reject something already live" guard).
  return transitionStatus(supabase, translationIds, ["ai_draft", "needs_review", "approved"], "rejected", reviewer, {
    reviewed_by: reviewer,
    reviewed_at: new Date().toISOString(),
    rejection_reason: reason,
  });
}

export async function archiveTranslations(translationIds: string[], reviewer: string): Promise<ReviewResult[]> {
  if (translationIds.length === 0) return [];
  const supabase = createServiceRoleClient();
  return transitionStatus(
    supabase,
    translationIds,
    ["ai_draft", "needs_review", "approved", "published", "rejected"],
    "archived",
    reviewer
  );
}

/**
 * The only thing that makes a translation actually playable (once
 * gameplay's own query also requires status='published' — see
 * lib/questions/loadQuestions.ts). Re-verifies "approved" server-side
 * regardless of what the browser last displayed (requirement 5).
 */
export async function publishTranslations(translationIds: string[], reviewer: string): Promise<ReviewResult[]> {
  if (translationIds.length === 0) return [];
  const supabase = createServiceRoleClient();
  return transitionStatus(supabase, translationIds, ["approved"], "published", reviewer, {
    published_at: new Date().toISOString(),
  });
}

/** Regenerate = force-regenerate for existing rows, one at a time, reusing
 * generateOne's own protections — a translation already 'published' is
 * refused there too (skipped_published), same as fresh generation. */
export async function regenerateTranslations(translationIds: string[], reviewer: string): Promise<GenerateResult[]> {
  if (translationIds.length === 0) return [];
  const supabase = createServiceRoleClient();
  const { data: rows, error } = await supabase
    .from("question_translations")
    .select("id, question_id, language_code")
    .in("id", translationIds);
  if (error) throw new Error(error.message);

  const found = new Set((rows ?? []).map((r) => r.id));
  const missing = translationIds.filter((id) => !found.has(id));

  const results = await generateTranslations(
    (rows ?? []).map((r) => ({ questionId: r.question_id as string, targetLanguage: r.language_code as string })),
    reviewer,
    { forceRegenerate: true }
  );

  for (const id of missing) {
    results.push({ questionId: "", targetLanguage: "", outcome: "failed", detail: `Translation id ${id} not found.` });
  }
  return results;
}

export interface EditTranslationPatch {
  questionText?: string;
  choice1?: string;
  choice2?: string;
  choice3?: string;
  choice4?: string;
  explanation?: string;
  reflection?: string | null;
}

/**
 * Edits a translation's content. Content edits always require re-review:
 * an already approved/published/rejected translation resets to
 * 'needs_review' (clearing reviewed_by/reviewed_at/published_at/
 * rejection_reason) — mirroring the exact rule the editorial pipeline's
 * applyEdit() already applies for canonical questions. This means editing
 * a PUBLISHED translation immediately takes it out of live rotation
 * (gameplay only ever serves status='published'), a deliberate safety
 * property, not an oversight: unreviewed content must never stay live.
 */
export async function editTranslation(translationId: string, patch: EditTranslationPatch, reviewer: string): Promise<ReviewResult> {
  const supabase = createServiceRoleClient();

  const { data: existing, error: fetchError } = await supabase
    .from("question_translations")
    .select("id, question_id, language_code, status, question_text, choice_1, choice_2, choice_3, choice_4, explanation, reflection")
    .eq("id", translationId)
    .maybeSingle();
  if (fetchError) return { translationId, outcome: "failed", detail: fetchError.message };
  if (!existing) return { translationId, outcome: "failed", detail: "Translation not found." };

  const next = {
    question_text: patch.questionText?.trim() || existing.question_text,
    choice_1: patch.choice1?.trim() || existing.choice_1,
    choice_2: patch.choice2?.trim() || existing.choice_2,
    choice_3: patch.choice3?.trim() || existing.choice_3,
    choice_4: patch.choice4?.trim() || existing.choice_4,
    explanation: patch.explanation?.trim() || existing.explanation,
    reflection: patch.reflection !== undefined ? patch.reflection?.trim() || null : existing.reflection,
  };

  const choices = [next.choice_1, next.choice_2, next.choice_3, next.choice_4];
  if (!next.question_text) return { translationId, outcome: "failed", detail: "Question text cannot be empty." };
  if (choices.some((c) => !c)) return { translationId, outcome: "failed", detail: "All four choices are required." };
  if (new Set(choices.map((c) => c.toLowerCase())).size !== 4) return { translationId, outcome: "failed", detail: "Choices must be unique." };
  if (!next.explanation) return { translationId, outcome: "failed", detail: "Explanation is required." };

  const resetStatuses = new Set(["approved", "published", "rejected"]);
  const nowIso = new Date().toISOString();
  const nextStatus = resetStatuses.has(existing.status) ? "needs_review" : existing.status;
  const resetting = nextStatus !== existing.status;

  const { error: updateError } = await supabase
    .from("question_translations")
    .update({
      ...next,
      status: nextStatus,
      reviewed_by: resetting ? null : undefined,
      reviewed_at: resetting ? null : undefined,
      published_at: resetting ? null : undefined,
      rejection_reason: resetting ? null : undefined,
      updated_at: nowIso,
    })
    .eq("id", translationId);
  if (updateError) return { translationId, outcome: "failed", detail: updateError.message };

  await logHistoryBatch(supabase, [
    {
      questionId: existing.question_id,
      languageCode: existing.language_code,
      actor: reviewer,
      action: "edited",
      detail: { previousStatus: existing.status, newStatus: nextStatus },
    },
  ]);

  return { translationId, outcome: "edited" };
}
