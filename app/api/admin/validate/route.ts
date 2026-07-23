import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getCanonicalQuestionStore } from "@/lib/questions/store";
import { validateQuestionBank } from "@/lib/questions/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Part 11 — reuses the exact Mission 5C validator, no reimplementation.
 * Groups issues by code so the Validation Center can show them clustered
 * by type with their affected question ids. */
export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const store = getCanonicalQuestionStore();
  const report = validateQuestionBank(store);

  const groupedByCode = new Map<string, { severity: string; code: string; count: number; questionIds: string[] }>();
  for (const issue of report.issues) {
    const key = `${issue.severity}:${issue.code}`;
    if (!groupedByCode.has(key)) {
      groupedByCode.set(key, { severity: issue.severity, code: issue.code, count: 0, questionIds: [] });
    }
    const group = groupedByCode.get(key)!;
    group.count += 1;
    group.questionIds.push(issue.questionId);
  }

  return NextResponse.json({
    totalQuestions: report.totalQuestions,
    errorCount: report.errorCount,
    warningCount: report.warningCount,
    isClean: report.isClean,
    groups: Array.from(groupedByCode.values()).sort((a, b) => b.count - a.count),
    issues: report.issues,
  });
}
