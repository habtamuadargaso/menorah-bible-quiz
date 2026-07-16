import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

import type {
  GeneratedQuestion,
  SupportedLanguage,
} from "./types";

import {
  buildCorrectAnswerPositions,
  placeCorrectAnswer,
} from "./shuffle";

export type SavedQuestionResult = {
  questionsSaved: number;
  translationsSaved: number;
  questionIds: string[];
  correctAnswerPositions: number[];
};

type ExistingQuestionRow = {
  question_text: string;
};

function getSupabaseServerClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const key =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL."
    );
  }

  if (!key) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function normalizeText(
  value: string
): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export async function loadExistingEnglishQuestions(
  level?: number
): Promise<Set<string>> {
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from("question_translations")
    .select(
      `
        question_text,
        language_code,
        questions!inner (
          id,
          level
        )
      `
    )
    .eq("language_code", "en")
    .limit(5000);

  if (typeof level === "number") {
    query = query.eq(
      "questions.level",
      level
    );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    throw new Error(
      `Unable to load existing questions: ${error.message}`
    );
  }

  const existingQuestions =
    new Set<string>();

  for (const row of
    (data ?? []) as ExistingQuestionRow[]) {
    if (!row.question_text) {
      continue;
    }

    existingQuestions.add(
      normalizeText(row.question_text)
    );
  }

  return existingQuestions;
}

export async function saveGeneratedQuestions(
  questions: GeneratedQuestion[],
  requestedLanguages: SupportedLanguage[]
): Promise<SavedQuestionResult> {
  if (questions.length === 0) {
    return {
      questionsSaved: 0,
      translationsSaved: 0,
      questionIds: [],
      correctAnswerPositions: [],
    };
  }

  const supabase = getSupabaseServerClient();

  const correctIndexes =
    buildCorrectAnswerPositions(
      questions.length
    );

  const questionRows =
    questions.map(
      (question, index) => ({
        id: `AI-L${question.level}-${randomUUID()}`,
        level: question.level,
        category: question.category,
        book: question.book,
        chapter: question.chapter,
        difficulty: question.difficulty,
        correct_index:
          correctIndexes[index],
        reference: question.reference,
        status: "published",
      })
    );

  const translationRows =
    questions.flatMap(
      (question, questionIndex) => {
        const questionRow =
          questionRows[questionIndex];

        return question.translations
          .filter((translation) =>
            requestedLanguages.includes(
              translation.languageCode
            )
          )
          .map((translation) => {
            const choices =
              placeCorrectAnswer(
                translation.correctAnswer,
                translation.wrongAnswers,
                questionRow.correct_index
              );

            return {
              question_id:
                questionRow.id,
              language_code:
                translation.languageCode,
              question_text:
                translation.question.trim(),
              choice_1: choices[0],
              choice_2: choices[1],
              choice_3: choices[2],
              choice_4: choices[3],
              explanation:
                translation.explanation.trim(),
              reflection:
                translation.reflection?.trim() ||
                null,
            };
          });
      }
    );

  const {
    error: questionInsertError,
  } = await supabase
    .from("questions")
    .insert(questionRows);

  if (questionInsertError) {
    throw new Error(
      `Unable to save questions: ${questionInsertError.message}`
    );
  }

  const {
    error: translationInsertError,
  } = await supabase
    .from("question_translations")
    .insert(translationRows);

  if (translationInsertError) {
    await supabase
      .from("questions")
      .delete()
      .in(
        "id",
        questionRows.map(
          (question) => question.id
        )
      );

    throw new Error(
      `Unable to save translations: ${translationInsertError.message}`
    );
  }

  return {
    questionsSaved:
      questionRows.length,
    translationsSaved:
      translationRows.length,
    questionIds:
      questionRows.map(
        (question) => question.id
      ),
    correctAnswerPositions:
      correctIndexes.map(
        (index) => index + 1
      ),
  };
}