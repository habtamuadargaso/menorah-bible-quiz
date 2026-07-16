import { NextRequest, NextResponse } from "next/server";

import { generateAndSaveQuestions } from "@/lib/question-factory/generator";
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

function normalizeLanguages(
  languages: string[] | undefined
): SupportedLanguage[] {
  const supportedLanguages = new Set<SupportedLanguage>([
    "en",
    "am",
    "om",
    "ti",
    "es",
    "fr",
    "de",
    "it",
    "pt",
    "ar",
    "sw",
    "hi",
    "zh",
    "ja",
    "ko",
  ]);

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
    const suppliedSecret =
      request.headers.get("x-admin-secret");

    const expectedSecret =
      process.env.QUESTION_ADMIN_SECRET;

    if (
      !expectedSecret ||
      suppliedSecret !== expectedSecret
    ) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body =
      (await request.json()) as GenerateRequestBody;

    const input: GenerateQuestionsInput = {
      level: Number(body.level ?? 1),
      count: Number(body.count ?? 1),
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
      duplicatesRejected:
        result.duplicatesRejected,
      invalidQuestionsRejected:
        result.invalidQuestionsRejected,
      generationAttempts:
        result.generationAttempts,
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
