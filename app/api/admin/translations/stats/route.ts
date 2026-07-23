import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { LANGUAGES } from "@/lib/i18n/locales";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["ai_draft", "needs_review", "approved", "published", "rejected", "archived"] as const;

/**
 * Mission 10 — GET /api/admin/translations/stats. Aggregate counts via
 * one grouped SQL query (get_translation_stats()), not by loading full
 * question/translation content into the app just to count it.
 */
export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);
  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const supabase = createServiceRoleClient();

  const [{ count: totalPublished, error: totalError }, { data: grouped, error: groupedError }, { count: failureCount, error: failureError }] =
    await Promise.all([
      supabase.from("questions").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.rpc("get_translation_stats"),
      supabase.from("translation_review_history").select("*", { count: "exact", head: true }).eq("action", "generate: failed"),
    ]);

  if (totalError) return NextResponse.json({ error: totalError.message }, { status: 500 });
  if (groupedError) return NextResponse.json({ error: groupedError.message }, { status: 500 });
  if (failureError) return NextResponse.json({ error: failureError.message }, { status: 500 });

  const total = totalPublished ?? 0;
  const byLanguage = LANGUAGES.map((lang) => {
    const counts: Record<(typeof STATUSES)[number], number> = {
      ai_draft: 0,
      needs_review: 0,
      approved: 0,
      published: 0,
      rejected: 0,
      archived: 0,
    };
    for (const row of (grouped ?? []) as Array<{ language_code: string; status: string; count: number }>) {
      if (row.language_code === lang.code && row.status in counts) {
        counts[row.status as (typeof STATUSES)[number]] = Number(row.count);
      }
    }
    const publishedCount = counts.published;
    const missingCount = Math.max(0, total - Object.values(counts).reduce((a, b) => a + b, 0));
    return {
      code: lang.code,
      englishName: lang.englishName,
      total,
      ...counts,
      missing: missingCount,
      completionPercent: total > 0 ? Math.round((publishedCount / total) * 100) : 0,
    };
  });

  return NextResponse.json({
    totalPublishedQuestions: total,
    byLanguage,
    recentTranslationFailures: failureCount ?? 0,
  });
}
