import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { publishEditorialQuestions } from "@/lib/admin/publishBridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublishReviewedBody = {
  questionIds?: string[];
  reviewer?: string;
};

/**
 * Mission 9 — the editorial-to-live publishing bridge's dedicated
 * endpoint. Also used internally (as a plain function call, not an HTTP
 * round-trip) by the Review Queue's existing "Publish Approved" action in
 * app/api/admin/questions/[id]/review/route.ts and app/api/admin/bulk/route.ts,
 * so there is exactly one implementation of "what does publishing an
 * editorial question actually do."
 *
 * Only ever accepts editorial question ids from the client — never full
 * question content (requirement 13). Every field written to
 * public.questions is re-read server-side from the current editorial
 * record (canonical bank / admin_imported_questions / question_review_overlay)
 * by lib/admin/publishBridge.ts, not accepted from this request body.
 */
export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);
  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const body = (await request.json().catch(() => ({}))) as PublishReviewedBody;
  if (!body.questionIds?.length) {
    return NextResponse.json({ error: "questionIds are required." }, { status: 400 });
  }
  const reviewer = body.reviewer?.trim();
  if (!reviewer) {
    return NextResponse.json({ error: "reviewer name is required for the audit trail." }, { status: 400 });
  }

  const results = await publishEditorialQuestions(body.questionIds, reviewer);
  return NextResponse.json({ success: true, results });
}
