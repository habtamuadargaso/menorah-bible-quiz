import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { importQuestions } from "@/lib/questions/importer";
import { getCanonicalQuestionStore } from "@/lib/questions/store";
import { appendImportedQuestions, loadImportedQuestions } from "@/lib/admin/reviewStore";
import type { BibleQuestion } from "@/lib/questions/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImportBody = { questions?: unknown[] };

/** Part 12: reuses the exact Mission 5C importQuestions() validator/gate
 * — nothing reimplemented here. Every accepted question is force-set to
 * verified:false and given no review overlay (so it defaults to "draft"),
 * regardless of what the imported JSON claims — imported content is never
 * auto-published or auto-approved. */
export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const body = (await request.json()) as ImportBody;
  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    return NextResponse.json({ error: "Provide a non-empty `questions` array." }, { status: 400 });
  }

  const existingImported = await loadImportedQuestions();
  const existingStore = [...getCanonicalQuestionStore(), ...existingImported];

  const result = importQuestions(body.questions, existingStore);
  const forcedDraft = result.accepted.map((q) => ({ ...q, verified: false }) as BibleQuestion);

  if (forcedDraft.length > 0) {
    await appendImportedQuestions(forcedDraft);
  }

  return NextResponse.json({
    acceptedCount: forcedDraft.length,
    acceptedIds: forcedDraft.map((q) => q.id),
    rejectedCount: result.rejected.length,
    rejected: result.rejected,
  });
}
