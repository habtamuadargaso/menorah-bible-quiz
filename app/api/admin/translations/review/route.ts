import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import {
  approveTranslations,
  archiveTranslations,
  publishTranslations,
  regenerateTranslations,
  rejectTranslations,
} from "@/lib/admin/translationWorkflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ReviewAction = "approve" | "reject" | "publish" | "archive" | "regenerate";

type ReviewBody = {
  action?: ReviewAction;
  translationIds?: string[];
  reviewer?: string;
  reason?: string;
};

/**
 * Mission 10 — POST /api/admin/translations/review. The browser sends only
 * translation ids + the intended action, never a trusted status — every
 * action re-verifies eligibility server-side via a WHERE-guarded update
 * (lib/admin/translationWorkflow.ts's transitionStatus), so a stale/forged
 * client-side status can never force an ineligible transition.
 */
export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);
  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const body = (await request.json().catch(() => ({}))) as ReviewBody;
  if (!body.action || !body.translationIds?.length) {
    return NextResponse.json({ error: "action and translationIds are required." }, { status: 400 });
  }
  const reviewer = body.reviewer?.trim();
  if (!reviewer) {
    return NextResponse.json({ error: "reviewer name is required for the audit trail." }, { status: 400 });
  }

  if (body.action === "reject" && !body.reason?.trim()) {
    return NextResponse.json({ error: "A reason is required to reject a translation." }, { status: 400 });
  }

  switch (body.action) {
    case "approve":
      return NextResponse.json({ success: true, results: await approveTranslations(body.translationIds, reviewer) });
    case "reject":
      return NextResponse.json({ success: true, results: await rejectTranslations(body.translationIds, reviewer, body.reason!.trim()) });
    case "publish":
      return NextResponse.json({ success: true, results: await publishTranslations(body.translationIds, reviewer) });
    case "archive":
      return NextResponse.json({ success: true, results: await archiveTranslations(body.translationIds, reviewer) });
    case "regenerate":
      return NextResponse.json({ success: true, results: await regenerateTranslations(body.translationIds, reviewer) });
    default:
      return NextResponse.json({ error: `Unknown action "${body.action}".` }, { status: 400 });
  }
}
