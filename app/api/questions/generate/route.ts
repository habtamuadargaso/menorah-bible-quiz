import { NextRequest, NextResponse } from "next/server";

import { generateAndSaveQuestions } from "@/lib/question-factory/generator";
import { isAuthorizedAdmin } from "@/lib/admin/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { LANGUAGES } from "@/lib/i18n/locales";
import type {
  GenerateQuestionsInput,
  SupportedLanguage,
} from "@/lib/question-factory/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type GenerateRequestBody = {
  level?: number;
  count?: number;
  book?: string;
  chapter?: number | null;
  category?: string;
  difficulty?: string;
  languages?: string[];
};

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unknown question-generation error.";
}

// Mission 10: derives from the one central language registry
// (lib/i18n/locales.ts) instead of a second, hand-maintained list that had
// already drifted out of sync with it (see lib/question-factory/types.ts).
const SUPPORTED_LANGUAGE_CODES = new Set<SupportedLanguage>(LANGUAGES.map((l) => l.code));

function normalizeLanguages(
  languages: string[] | undefined
): SupportedLanguage[] {
  const supportedLanguages = SUPPORTED_LANGUAGE_CODES;

  const normalized = Array.from(
    new Set(
      (languages ?? ["en", "am"])
        .map((language) =>
          String(language).trim().toLowerCase()
        )
        .filter((language): language is SupportedLanguage =>
          supportedLanguages.has(language as SupportedLanguage)
        )
    )
  );

  if (!normalized.includes("en")) {
    normalized.unshift("en");
  }

  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    // Checked before auth so this also caps repeated failed-secret
    // guesses against this endpoint, not just successful (costly)
    // generations. 5 requests per 10 minutes per IP.
    const rate = checkRateLimit(request, "questions-generate", 5, 10 * 60 * 1000);
    if (!rate.allowed) return rateLimitResponse(rate);

    if (!(await isAuthorizedAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body =
      (await request.json()) as GenerateRequestBody;

    const requestedCount = Number(body.count ?? 10);
    if (
      !Number.isFinite(requestedCount) ||
      !Number.isInteger(requestedCount) ||
      requestedCount < 1 ||
      requestedCount > 100
    ) {
      return NextResponse.json(
        { error: "count must be a whole number between 1 and 100." },
        { status: 400 }
      );
    }

    const input: GenerateQuestionsInput = {
      level: Number(body.level ?? 1),
      count: requestedCount,
      book: String(body.book ?? "Genesis"),
      chapter:
        typeof body.chapter === "number"
          ? body.chapter
          : null,
      category: String(body.category ?? "Bible"),
      difficulty: String(body.difficulty ?? "easy"),
      languages: normalizeLanguages(body.languages),
    };

    const result =
      await generateAndSaveQuestions(input);

    return NextResponse.json({
      success: true,
      generated: result.questionsSaved,
      translations: result.translationsSaved,
      level: result.level,
      languages: result.languages,
      correctAnswerPositions:
        result.correctAnswerPositions,
      diagnostics: result.diagnostics,
      questionIds: result.questionIds,
      message: `${result.questionsSaved} new unique questions and ${result.translationsSaved} translations were saved successfully.`,
    });
  } catch (error: unknown) {
    console.error(
      "Question generation failed:",
      error
    );

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
