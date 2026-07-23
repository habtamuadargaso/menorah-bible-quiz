import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getAdminQuestionById } from "@/lib/admin/adminQuestions";
import { validateQuestionBank } from "@/lib/questions/validate";
import { getCanonicalQuestionStore } from "@/lib/questions/store";
import { applyEdit } from "@/lib/admin/reviewStore";
import type { QuestionOverlay } from "@/lib/admin/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();
  const question = await getAdminQuestionById(params.id);
  if (!question) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(question);
}

type EditBody = {
  reviewer?: string;
  patch?: QuestionOverlay["edits"];
};

/** Applies an edit, then re-validates the WHOLE store with the edit
 * applied in-memory before persisting anything — Part 8's "run validator
 * before saving, reject invalid edits." A rejected edit is never written
 * to the overlay file. */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const rate = checkRateLimit(request, "admin-api", 120, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const body = (await request.json()) as EditBody;
  if (!body.patch || Object.keys(body.patch).length === 0) {
    return NextResponse.json({ error: "No changes supplied." }, { status: 400 });
  }
  const reviewer = body.reviewer?.trim() || "unknown-admin";

  const canonical = getCanonicalQuestionStore();
  const target = canonical.find((q) => q.id === params.id);
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const candidate = {
    ...target,
    ...body.patch,
    translations: body.patch.translations ? { ...target.translations, ...body.patch.translations } : target.translations,
  };
  const testBank = canonical.map((q) => (q.id === params.id ? candidate : q));
  const report = validateQuestionBank(testBank);
  const errorsForThisQuestion = report.issues.filter((i) => i.questionId === params.id && i.severity === "error");

  if (errorsForThisQuestion.length > 0) {
    return NextResponse.json(
      { error: "Edit rejected by validator.", validationErrors: errorsForThisQuestion.map((i) => i.message) },
      { status: 422 }
    );
  }

  const overlay = await applyEdit(params.id, body.patch, reviewer);
  return NextResponse.json({ success: true, overlay });
}
