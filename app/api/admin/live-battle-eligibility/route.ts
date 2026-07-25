import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { computeLiveBattleEligibility } from "@/lib/i18n/languageAvailability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mission 14 Part C — GET /api/admin/live-battle-eligibility. Exact
 * (not threshold/boolean) gameplay-eligible question counts per
 * language × level, plus each language's translation review-pipeline
 * status breakdown. Backs the admin "Live Battle Eligibility" tab so
 * newly published questions/translations can be verified to actually be
 * seedRoomQuestions()-eligible, not just present somewhere in the pipeline.
 */
export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);
  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  try {
    const languages = await computeLiveBattleEligibility();
    return NextResponse.json({ languages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to compute Live Battle eligibility.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
