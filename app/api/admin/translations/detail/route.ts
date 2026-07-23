import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mission 10 — Translation Editor detail fetch, keyed by the natural
 * (questionId, targetLanguage) pair rather than a translation's own uuid,
 * so it works even for a "missing" row (no translation exists yet, so
 * there's no uuid to address it by). Editing an existing translation
 * still goes through PATCH /api/admin/translations/[id], which does need
 * the uuid — that's only reachable once a row exists.
 */
export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);
  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;
  const questionId = params.get("questionId");
  const targetLanguage = params.get("targetLanguage");
  const sourceLanguage = params.get("sourceLanguage") || "en";
  if (!questionId || !targetLanguage) {
    return NextResponse.json({ error: "questionId and targetLanguage are required." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const [{ data: question, error: questionError }, { data: source, error: sourceError }, { data: target, error: targetError }] = await Promise.all([
    supabase.from("questions").select("id, level, category, book, chapter, difficulty, reference, status, source_type").eq("id", questionId).maybeSingle(),
    supabase
      .from("question_translations")
      .select("question_text, choice_1, choice_2, choice_3, choice_4, explanation, reflection, status")
      .eq("question_id", questionId)
      .eq("language_code", sourceLanguage)
      .maybeSingle(),
    supabase
      .from("question_translations")
      .select(
        "id, question_text, choice_1, choice_2, choice_3, choice_4, explanation, reflection, status, source_language, translation_provider, ai_model, generated_at, reviewed_by, reviewed_at, rejection_reason, quality_score, published_at, updated_at"
      )
      .eq("question_id", questionId)
      .eq("language_code", targetLanguage)
      .maybeSingle(),
  ]);
  if (questionError) return NextResponse.json({ error: questionError.message }, { status: 500 });
  if (sourceError) return NextResponse.json({ error: sourceError.message }, { status: 500 });
  if (targetError) return NextResponse.json({ error: targetError.message }, { status: 500 });
  if (!question) return NextResponse.json({ error: "Question not found." }, { status: 404 });

  return NextResponse.json({ question, source, target });
}
