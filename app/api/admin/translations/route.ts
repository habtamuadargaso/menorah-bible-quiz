import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { LANGUAGES } from "@/lib/i18n/locales";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORTED_CODES = new Set(LANGUAGES.map((l) => l.code));
// Safety cap on how many published questions this route will ever load
// into memory before filtering/paginating in JS (same "load a bounded set,
// filter/paginate in JS" pattern lib/admin/adminQuestions.ts already uses
// for the editorial Question Bank) — not an aggregate query (that's what
// /api/admin/translations/stats is for), just a bounded browse list.
const MAX_QUESTIONS_SCANNED = 2000;
const PAGE_SIZE_DEFAULT = 25;

type TranslationRow = {
  id: string | null;
  status: "missing" | "ai_draft" | "needs_review" | "approved" | "published" | "rejected" | "archived";
  questionText: string | null;
  explanation: string | null;
  generatedAt: string | null;
  reviewedBy: string | null;
  publishedAt: string | null;
  rejectionReason: string | null;
  validation: "clean" | "incomplete" | "n/a";
};

/**
 * Mission 10 — GET /api/admin/translations. Lists published questions
 * with their translation status for ONE target language at a time (the
 * Global Translations tab's main table), including an English source
 * preview for quick reference. A row's target translation is a real row
 * OR a synthetic "missing" placeholder when none exists yet.
 */
export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);
  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;
  const targetLanguage = params.get("targetLanguage");
  if (!targetLanguage || !SUPPORTED_CODES.has(targetLanguage as never)) {
    return NextResponse.json({ error: "targetLanguage is required and must be a supported language code." }, { status: 400 });
  }
  const sourceLanguage = params.get("sourceLanguage") || "en";
  const level = params.get("level") ? Number(params.get("level")) : undefined;
  const sourceType = params.get("sourceType") ?? undefined; // 'canonical' | 'imported' | 'ai-factory'
  const statusFilter = params.get("status") ?? undefined; // 'missing' | ai_draft | needs_review | approved | published | rejected | archived
  const search = params.get("search")?.trim().toLowerCase() || undefined;
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? PAGE_SIZE_DEFAULT)));

  const supabase = createServiceRoleClient();

  let questionQuery = supabase
    .from("questions")
    .select("id, level, category, book, chapter, difficulty, reference, source_type")
    .eq("status", "published")
    .order("id", { ascending: true })
    .limit(MAX_QUESTIONS_SCANNED);
  if (level) questionQuery = questionQuery.eq("level", level);
  if (sourceType === "ai-factory") questionQuery = questionQuery.is("source_type", null);
  else if (sourceType === "canonical" || sourceType === "imported") questionQuery = questionQuery.eq("source_type", sourceType);

  const { data: questions, error: questionsError } = await questionQuery;
  if (questionsError) return NextResponse.json({ error: questionsError.message }, { status: 500 });

  const questionIds = (questions ?? []).map((q) => q.id as string);
  if (questionIds.length === 0) {
    return NextResponse.json({ items: [], total: 0, page, pageSize, totalPages: 1 });
  }

  const { data: translations, error: translationsError } = await supabase
    .from("question_translations")
    .select(
      "id, question_id, language_code, question_text, choice_1, choice_2, choice_3, choice_4, explanation, status, generated_at, reviewed_by, published_at, rejection_reason"
    )
    .in("question_id", questionIds)
    .in("language_code", [sourceLanguage, targetLanguage]);
  if (translationsError) return NextResponse.json({ error: translationsError.message }, { status: 500 });

  const sourceByQuestion = new Map<string, { questionText: string }>();
  const targetByQuestion = new Map<string, (typeof translations)[number]>();
  for (const t of translations ?? []) {
    if (t.language_code === sourceLanguage) sourceByQuestion.set(t.question_id as string, { questionText: t.question_text as string });
    if (t.language_code === targetLanguage) targetByQuestion.set(t.question_id as string, t);
  }

  let merged = (questions ?? []).map((q) => {
    const target = targetByQuestion.get(q.id as string);
    const source = sourceByQuestion.get(q.id as string);
    const translationRow: TranslationRow = target
      ? {
          id: target.id as string,
          status: target.status as TranslationRow["status"],
          questionText: target.question_text as string,
          explanation: target.explanation as string,
          generatedAt: target.generated_at as string | null,
          reviewedBy: target.reviewed_by as string | null,
          publishedAt: target.published_at as string | null,
          rejectionReason: target.rejection_reason as string | null,
          validation:
            target.question_text && target.choice_1 && target.choice_2 && target.choice_3 && target.choice_4 && target.explanation
              ? "clean"
              : "incomplete",
        }
      : { id: null, status: "missing", questionText: null, explanation: null, generatedAt: null, reviewedBy: null, publishedAt: null, rejectionReason: null, validation: "n/a" };

    return {
      questionId: q.id as string,
      level: q.level as number,
      book: q.book as string,
      reference: q.reference as string,
      category: q.category as string,
      sourceType: (q.source_type as string | null) ?? null,
      sourceLanguage,
      sourceText: source?.questionText ?? null,
      targetLanguage,
      translation: translationRow,
    };
  });

  if (statusFilter) {
    merged = merged.filter((row) => row.translation.status === statusFilter);
  }
  if (search) {
    merged = merged.filter(
      (row) =>
        row.questionId.toLowerCase().includes(search) ||
        row.reference.toLowerCase().includes(search) ||
        row.sourceText?.toLowerCase().includes(search) ||
        row.translation.questionText?.toLowerCase().includes(search)
    );
  }

  const total = merged.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const items = merged.slice(start, start + pageSize);

  return NextResponse.json({ items, total, page, pageSize, totalPages });
}
