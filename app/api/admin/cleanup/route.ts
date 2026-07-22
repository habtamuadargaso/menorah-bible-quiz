import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CleanupBody = { confirm?: boolean };

/**
 * Mission 7 Part 13: triggers cleanup_stale_rooms() (see
 * supabase/migrations/20260724_mission7_data_retention.sql). Dry-run by
 * default — actual deletion requires an explicit {"confirm": true} body,
 * so this can't be triggered destructively by an accidental GET-style
 * call or an unconfirmed automation run.
 *
 * Only ever deletes abandoned 'waiting' rooms older than 2 hours. Never
 * touches active ('playing'/'revealing') or 'finished' rooms — see the
 * migration file for why finished rooms are out of scope entirely.
 */
export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-cleanup", 20, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const body = (await request.json().catch(() => ({}))) as CleanupBody;
  const dryRun = body.confirm !== true;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("cleanup_stale_rooms", { p_dry_run: dryRun });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    dryRun,
    wouldDeleteCount: result?.would_delete_count ?? 0,
    deletedCount: result?.deleted_count ?? 0,
    roomIds: result?.room_ids ?? [],
  });
}
