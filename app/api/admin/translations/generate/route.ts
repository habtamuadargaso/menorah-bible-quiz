import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, unauthorizedResponse } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { generateTranslations } from "@/lib/admin/translationWorkflow";
import { LANGUAGES } from "@/lib/i18n/locales";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPPORTED_CODES = new Set(LANGUAGES.map((l) => l.code));
const MAX_PAIRS_PER_REQUEST = 60; // e.g. 20 questions x 3 languages, or 60 questions x 1 language

type GenerateBody = {
  questionIds?: string[];
  targetLanguages?: string[];
  forceRegenerate?: boolean;
  reviewer?: string;
};

/**
 * Mission 10 — POST /api/admin/translations/generate.
 *
 * Only ever accepts question ids + target language codes from the
 * browser — never trusts question text supplied by the client (it's
 * always re-loaded server-side from the approved/published English source
 * row by lib/admin/translationWorkflow.ts). Cross-product batched with a
 * hard cap and controlled internal concurrency (never "hundreds of AI
 * requests simultaneously").
 */
export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-api", 30, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);
  if (!(await isAuthorizedAdmin(request))) return unauthorizedResponse();

  const body = (await request.json().catch(() => ({}))) as GenerateBody;
  if (!body.questionIds?.length || !body.targetLanguages?.length) {
    return NextResponse.json({ error: "questionIds and targetLanguages are required." }, { status: 400 });
  }
  const reviewer = body.reviewer?.trim();
  if (!reviewer) {
    return NextResponse.json({ error: "reviewer name is required for the audit trail." }, { status: 400 });
  }

  const invalidLanguages = body.targetLanguages.filter((lang) => !SUPPORTED_CODES.has(lang as never));
  if (invalidLanguages.length > 0) {
    return NextResponse.json({ error: `Unsupported language code(s): ${invalidLanguages.join(", ")}` }, { status: 400 });
  }

  const pairs = body.questionIds.flatMap((questionId) => body.targetLanguages!.map((targetLanguage) => ({ questionId, targetLanguage })));
  if (pairs.length > MAX_PAIRS_PER_REQUEST) {
    return NextResponse.json(
      { error: `Too many question/language combinations in one request (${pairs.length}). Maximum is ${MAX_PAIRS_PER_REQUEST} — split into smaller batches.` },
      { status: 400 }
    );
  }

  const results = await generateTranslations(pairs, reviewer, { forceRegenerate: body.forceRegenerate === true });
  return NextResponse.json({ success: true, results });
}
