import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { queryAdminQuestions, type AdminQuestionFilters } from "@/lib/admin/adminQuestions";
import { validateQuestionBank } from "@/lib/questions/validate";
import { getCanonicalQuestionStore } from "@/lib/questions/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Part 12: export JSON (all or filtered, same filter params the
 * Question Bank uses) and export the validation report. `kind=validation`
 * exports the full grouped validator report instead of question rows. */
export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;
  const kind = params.get("kind") ?? "questions";

  if (kind === "validation") {
    const store = getCanonicalQuestionStore();
    const report = validateQuestionBank(store);
    return NextResponse.json(report, {
      headers: { "Content-Disposition": `attachment; filename="validation-report.json"` },
    });
  }

  const filters: AdminQuestionFilters = {
    search: params.get("search") ?? undefined,
    language: (params.get("language") as AdminQuestionFilters["language"]) ?? undefined,
    book: params.get("book") ?? undefined,
    testament: (params.get("testament") as AdminQuestionFilters["testament"]) ?? undefined,
    level: params.get("level") ? Number(params.get("level")) : undefined,
    difficulty: (params.get("difficulty") as AdminQuestionFilters["difficulty"]) ?? undefined,
    category: params.get("category") ?? undefined,
    reviewStatus: (params.get("reviewStatus") as AdminQuestionFilters["reviewStatus"]) ?? undefined,
    page: 1,
    pageSize: 5000,
  };
  const { items } = await queryAdminQuestions(filters);

  return NextResponse.json(items, {
    headers: { "Content-Disposition": `attachment; filename="questions-export.json"` },
  });
}
