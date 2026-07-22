import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import {
  bulkAddTag,
  bulkDeleteImportedQuestions,
  bulkPublishApproved,
  bulkRestoreReviewState,
  bulkSetCategory,
  bulkSetReviewStatus,
  restoreDeletedQuestions,
} from "@/lib/admin/reviewStore";
import type { ReviewStatus } from "@/lib/admin/types";
import type { BibleQuestion } from "@/lib/questions/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BulkAction = "approve" | "reject" | "needs-review" | "archive" | "add-tag" | "set-category" | "publish" | "delete" | "restore";

type RestoreItem = {
  questionId?: string;
  status?: ReviewStatus;
  reviewer?: string | null;
  reviewedAt?: string | null;
  reason?: string | null;
};

type BulkBody = {
  action?: BulkAction;
  questionIds?: string[];
  reviewer?: string;
  reason?: string;
  tag?: string;
  category?: string;
  /** "restore" only — the Undo Last Bulk Action snapshot the client
   * captured right before the action it's now reversing. */
  items?: RestoreItem[];
  /** "restore" only — full payloads of any questions a preceding
   * "delete" bulk action removed, so undoing it can recreate them. */
  deletedQuestions?: BibleQuestion[];
};

const ACTION_TO_STATUS: Partial<Record<BulkAction, ReviewStatus>> = {
  approve: "approved",
  reject: "rejected",
  "needs-review": "needs-review",
  archive: "archived",
};

/**
 * Part 13, updated Mission 8. "Export selected" is handled client-side
 * (it's just filtering the already-loaded rows).
 *
 * "delete" was deliberately left out of Part 13 with the reasoning "never
 * permanently delete without confirmation — archive is the only
 * destructive-adjacent action." Mission 8 adds a real delete, but keeps
 * that same caution: it only ever removes AI-imported draft rows (never
 * the compiled canonical bank — see bulkDeleteImportedQuestions's doc
 * comment), always requires a reason for the audit trail, and the client
 * requires an explicit confirmation dialog before calling this. "restore"
 * (Undo Last Bulk Action) exists specifically so a delete — or any other
 * bulk action — isn't a one-way door for the admin who triggered it.
 */
export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const body = (await request.json()) as BulkBody;
  if (!body.action) {
    return NextResponse.json({ error: "action is required." }, { status: 400 });
  }
  const reviewer = body.reviewer?.trim();
  if (!reviewer) {
    return NextResponse.json({ error: "reviewer name is required for the audit trail." }, { status: 400 });
  }

  if (body.action === "restore") {
    const items = (body.items ?? [])
      .filter((item): item is Required<Pick<RestoreItem, "questionId" | "status">> & RestoreItem => Boolean(item.questionId && item.status))
      .map((item) => ({
        questionId: item.questionId!,
        status: item.status!,
        reviewer: item.reviewer ?? null,
        reviewedAt: item.reviewedAt ?? null,
        reason: item.reason ?? null,
      }));
    if (items.length === 0) {
      return NextResponse.json({ error: "items (with questionId and status) are required to undo a bulk action." }, { status: 400 });
    }
    if (body.deletedQuestions?.length) {
      await restoreDeletedQuestions(body.deletedQuestions);
    }
    await bulkRestoreReviewState(items, reviewer);
    return NextResponse.json({ success: true, restored: items.length });
  }

  if (!body.questionIds?.length) {
    return NextResponse.json({ error: "questionIds are required." }, { status: 400 });
  }
  if (body.action === "reject" && !body.reason?.trim()) {
    return NextResponse.json({ error: "A reason is required to reject questions." }, { status: 400 });
  }

  if (body.action === "delete") {
    if (!body.reason?.trim()) {
      return NextResponse.json({ error: "A reason is required to delete questions." }, { status: 400 });
    }
    const result = await bulkDeleteImportedQuestions(body.questionIds, reviewer, body.reason.trim());
    return NextResponse.json({ success: true, ...result });
  }

  if (body.action === "publish") {
    const result = await bulkPublishApproved(body.questionIds, reviewer);
    return NextResponse.json({ success: true, ...result });
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
