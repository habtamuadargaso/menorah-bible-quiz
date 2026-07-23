import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { computeLanguageAvailability } from "@/lib/i18n/languageAvailability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mission 10 — public, read-only language-availability endpoint. Backs
 * the language selector(s), settings, and the admin Translation Center —
 * one source of truth instead of each surface guessing independently.
 * No admin auth required (this is genuinely public information — "is
 * French playable" isn't sensitive), but still rate-limited like every
 * other route in this app.
 */
export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, "languages-availability", 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  try {
    const languages = await computeLanguageAvailability();
    return NextResponse.json({ languages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to compute language availability.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
