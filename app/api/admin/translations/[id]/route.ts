import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { editTranslation, type EditTranslationPatch } from "@/lib/admin/translationWorkflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET-by-natural-key lives at /api/admin/translations/detail (works even
// when no translation row exists yet, i.e. status "missing" — this route
// is addressed by the translation's own uuid, which a "missing" row
// doesn't have). This file only handles PATCH (editing requires an
// existing row by construction).

type PatchBody = {
  reviewer?: string;
  patch?: EditTranslationPatch;
};

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);
  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const body = (await request.json().catch(() => ({}))) as PatchBody;
  if (!body.patch || Object.keys(body.patch).length === 0) {
    return NextResponse.json({ error: "No changes supplied." }, { status: 400 });
  }
  const reviewer = body.reviewer?.trim();
  if (!reviewer) {
    return NextResponse.json({ error: "reviewer name is required for the audit trail." }, { status: 400 });
  }

  const result = await editTranslation(params.id, body.patch, reviewer);
  if (result.outcome === "failed") {
    return NextResponse.json({ error: result.detail ?? "Edit failed." }, { status: 422 });
  }
  return NextResponse.json({ success: true, result });
}
