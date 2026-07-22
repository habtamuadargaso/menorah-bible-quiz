import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { queryAdminQuestions } from "@/lib/admin/adminQuestions";
import type { AdminQuestionFilters } from "@/lib/admin/adminQuestions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;
  const filters: AdminQuestionFilters = {
    search: params.get("search") ?? undefined,
    language: (params.get("language") as AdminQuestionFilters["language"]) ?? undefined,
    book: params.get("book") ?? undefined,
    testament: (params.get("testament") as AdminQuestionFilters["testament"]) ?? undefined,
    level: params.get("level") ? Number(params.get("level")) : undefined,
    difficulty: (params.get("difficulty") as AdminQuestionFilters["difficulty"]) ?? undefined,
    category: params.get("category") ?? undefined,
    reviewStatus: (params.get("reviewStatus") as AdminQuestionFilters["reviewStatus"]) ?? undefined,
    translationStatusLanguage: (params.get("translationStatusLanguage") as AdminQuestionFilters["translationStatusLanguage"]) ?? undefined,
    translationStatus: (params.get("translationStatus") as AdminQuestionFilters["translationStatus"]) ?? undefined,
    hasExplanation: params.get("hasExplanation") === "true" ? true : undefined,
    missingTranslations: params.get("missingTranslations") === "true" ? true : undefined,
    page: params.get("page") ? Number(params.get("page")) : undefined,
    pageSize: params.get("pageSize") ? Number(params.get("pageSize")) : undefined,
  };

  const result = await queryAdminQuestions(filters);
  return NextResponse.json(result);
}
