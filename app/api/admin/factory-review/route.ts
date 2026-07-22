import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TARGET_STATUSES = ["published", "rejected"] as const;
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

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);
  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const body = (await request.json().catch(() => ({}))) as { questionIds?: string[]; status?: TargetStatus };
  if (!body.questionIds?.length || !body.status || !VALID_TARGET_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: `questionIds and status (one of ${VALID_TARGET_STATUSES.join(", ")}) are required.` }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("questions")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .in("id", body.questionIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, affected: body.questionIds.length });
}
