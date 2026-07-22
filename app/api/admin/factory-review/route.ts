import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TARGET_STATUSES = ["published", "rejected", "deleted"] as const;
type TargetStatus = (typeof VALID_TARGET_STATUSES)[number];

/**
 * Mission 7 Part 1/5 fix: the AI Question Factory (/api/questions/generate)
 * used to write straight to status:"published" with no review step,
 * violating CLAUDE.md's "no auto-publish" rule. It now writes "draft" —
 * this route is the replacement review step, so that fix doesn't just
 * make the Factory silently useless. Uses the service-role client since
 * RLS on `questions` only allows reading status:"published" rows —
 * authorization is enforced by isAuthorizedAdmin() before this runs.
 */
export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);
  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("questions")
    .select("id, level, category, book, chapter, difficulty, reference, status, created_at, question_translations(language_code, question_text)")
    .neq("status", "published")
    .neq("status", "rejected")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

type ReviewBody = {
  questionIds?: string[];
  status?: TargetStatus;
  reason?: string;
  reviewer?: string;
};

/** Batches one history row per affected question into a single insert —
 * this pipeline has no overlay table of its own, but question_review_history
 * is a generic append-only audit log keyed by a free-text question_id
 * column (no foreign key), so it works equally well for `questions` rows
 * as it does for the canonical/imported pipeline it was originally built
 * for. */
async function logAudit(
  supabase: ReturnType<typeof createServiceRoleClient>,
  questionIds: string[],
  reviewer: string,
  action: string,
  detail?: string | null
) {
  if (questionIds.length === 0) return;
  const { error } = await supabase.from("question_review_history").insert(
    questionIds.map((questionId) => ({ question_id: questionId, reviewer, action, detail: detail ?? null }))
  );
  // Audit logging must never block the actual review action from
  // succeeding — surface it server-side, don't fail the request over it.
  if (error) console.error("Failed to write question_review_history for factory review:", error.message);
}

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);
  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const body = (await request.json().catch(() => ({}))) as ReviewBody;
  if (!body.questionIds?.length || !body.status || !VALID_TARGET_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: `questionIds and status (one of ${VALID_TARGET_STATUSES.join(", ")}) are required.` }, { status: 400 });
  }
  const reviewer = body.reviewer?.trim();
  if (!reviewer) {
    return NextResponse.json({ error: "reviewer name is required for the audit trail." }, { status: 400 });
  }
  if (body.status === "rejected" && !body.reason?.trim()) {
    return NextResponse.json({ error: "A reason is required to reject a question." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  if (body.status === "deleted") {
    // Defense in depth: never delete a question that's already published
    // to real players, even if a stale client-side list asked for it —
    // permanent question ids matter once live (CLAUDE.md rule 4).
    const { data: rows, error: fetchError } = await supabase.from("questions").select("id, status").in("id", body.questionIds);
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

    const deletable = (rows ?? []).filter((row) => row.status !== "published").map((row) => row.id as string);
    const skipped = body.questionIds.filter((id) => !deletable.includes(id));

    if (deletable.length > 0) {
      await logAudit(supabase, deletable, reviewer, "deleted", body.reason?.trim());
      const { error: deleteError } = await supabase.from("questions").delete().in("id", deletable);
      if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: deletable, skipped });
  }

  const { error } = await supabase
    .from("questions")
    .update({
      status: body.status,
      updated_at: new Date().toISOString(),
      ...(body.status === "rejected" ? { rejected_reason: body.reason!.trim() } : {}),
    })
    .in("id", body.questionIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(supabase, body.questionIds, reviewer, body.status, body.status === "rejected" ? body.reason?.trim() : undefined);

  return NextResponse.json({ success: true, affected: body.questionIds.length });
}
