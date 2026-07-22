import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getOverlay, setReviewStatus } from "@/lib/admin/reviewStore";
import type { ReviewStatus } from "@/lib/admin/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES: ReviewStatus[] = ["draft", "needs-review", "approved", "published", "rejected", "archived"];

type ReviewBody = {
  status?: ReviewStatus;
  reviewer?: string;
  reason?: string;
};

/** Part 9: every status change here is a direct, explicit admin action —
 * nothing in this codebase calls this route automatically. Rejecting
 * without a reason is refused when settings.reviewWorkflow.requireReasonOnReject
 * is on (default true). */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const body = (await request.json()) as ReviewBody;
  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: `status must be one of ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }
  const reviewer = body.reviewer?.trim();
  if (!reviewer) {
    return NextResponse.json({ error: "reviewer name is required for the audit trail." }, { status: 400 });
  }
  if (body.status === "rejected" && !body.reason?.trim()) {
    return NextResponse.json({ error: "A reason is required to reject a question." }, { status: 400 });
  }
  if (body.status === "published") {
    const current = await getOverlay(params.id);
    if (current.review.status !== "approved") {
      return NextResponse.json({ error: "Only an approved question can be published." }, { status: 400 });
    }
  }

  const overlay = await setReviewStatus(params.id, body.status, reviewer, body.reason);
  return NextResponse.json({ success: true, overlay });
}
