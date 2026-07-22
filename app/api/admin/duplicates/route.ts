import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { findDuplicateCandidates } from "@/lib/admin/adminQuestions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Part 14 — flags candidates only; never merges or deletes anything. */
export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();
  const groups = await findDuplicateCandidates();
  return NextResponse.json({ groups, totalGroups: groups.length });
}
