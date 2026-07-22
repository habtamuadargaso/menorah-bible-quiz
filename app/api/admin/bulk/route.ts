import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { bulkAddTag, bulkSetCategory, bulkSetReviewStatus } from "@/lib/admin/reviewStore";
import type { ReviewStatus } from "@/lib/admin/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BulkAction = "approve" | "reject" | "needs-review" | "archive" | "add-tag" | "set-category";

type BulkBody = {
  action?: BulkAction;
  questionIds?: string[];
  reviewer?: string;
  reason?: string;
  tag?: string;
  category?: string;
};

const ACTION_TO_STATUS: Partial<Record<BulkAction, ReviewStatus>> = {
  approve: "approved",
  reject: "rejected",
  "needs-review": "needs-review",
  archive: "archived",
};

/** Part 13. "Export selected" is handled client-side (it's just filtering
 * the already-loaded rows) and "Never permanently delete without
 * confirmation" is honored by not exposing a delete action at all here —
 * archive is the only destructive-adjacent action, and it's reversible
 * (an archived question can be moved back to any other status). */
export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const body = (await request.json()) as BulkBody;
  if (!body.action || !body.questionIds?.length) {
    return NextResponse.json({ error: "action and questionIds are required." }, { status: 400 });
  }
  const reviewer = body.reviewer?.trim();
  if (!reviewer) {
    return NextResponse.json({ error: "reviewer name is required for the audit trail." }, { status: 400 });
  }
  if (body.action === "reject" && !body.reason?.trim()) {
    return NextResponse.json({ error: "A reason is required to reject questions." }, { status: 400 });
  }

  if (body.action === "add-tag") {
    if (!body.tag?.trim()) return NextResponse.json({ error: "tag is required." }, { status: 400 });
    await bulkAddTag(body.questionIds, body.tag.trim(), reviewer);
    return NextResponse.json({ success: true, affected: body.questionIds.length });
  }

  if (body.action === "set-category") {
    if (!body.category?.trim()) return NextResponse.json({ error: "category is required." }, { status: 400 });
    await bulkSetCategory(body.questionIds, body.category.trim(), reviewer);
    return NextResponse.json({ success: true, affected: body.questionIds.length });
  }

  const status = ACTION_TO_STATUS[body.action];
  if (!status) {
    return NextResponse.json({ error: `Unknown action "${body.action}".` }, { status: 400 });
  }
  await bulkSetReviewStatus(body.questionIds, status, reviewer, body.reason);
  return NextResponse.json({ success: true, affected: body.questionIds.length });
}
