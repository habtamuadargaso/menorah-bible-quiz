import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getCanonicalQuestionStore } from "@/lib/questions/store";
import { validateQuestionBank } from "@/lib/questions/validate";
import { computeCategoryStats, computeQuestionBankStats, computeTranslationCompletion } from "@/lib/questions/stats";
import { getAllAdminQuestions } from "@/lib/admin/adminQuestions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Part 3 — every number here is computed live from the canonical store
 * and the review overlay, never hardcoded. */
export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const store = getCanonicalQuestionStore();
  const report = validateQuestionBank(store);
  const admin = await getAllAdminQuestions();

  const reviewCounts = { draft: 0, "needs-review": 0, approved: 0, published: 0, rejected: 0, archived: 0 };
  for (const q of admin) reviewCounts[q.review.status] += 1;

  return NextResponse.json({
    totalCanonicalQuestions: store.length,
    languageBreakdown: computeQuestionBankStats(store),
    categoryBreakdown: computeCategoryStats(store),
    translationCompletion: computeTranslationCompletion(store),
    reviewCounts,
    validation: { errorCount: report.errorCount, warningCount: report.warningCount },
  });
}
