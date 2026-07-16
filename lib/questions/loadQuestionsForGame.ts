import type { CategoryId } from "@/lib/categories";
import type { LangCode } from "@/lib/i18n/locales";
import type {
  Difficulty,
  Question,
} from "@/lib/questions/types";

import { shuffle } from "@/lib/shuffle";
import { loadQuestionsForLevel } from "./loadQuestions";
import { questionsForLevel } from "./index";

const QUESTIONS_PER_GAME = 10;

const DATABASE_CATEGORY_BY_GAME_CATEGORY: Record<
  CategoryId,
  string[]
> = {
  "old-testament": ["Old Testament", "old-testament"],
  "new-testament": ["New Testament", "new-testament"],
  "life-of-jesus": ["Life of Jesus", "life-of-jesus"],
  apostles: ["Apostles", "apostles"],
  "bible-characters": ["Bible Characters", "bible-characters"],
  "youth-challenge": ["Youth Challenge", "youth-challenge"],
  "psalms-proverbs": [
    "Psalms & Proverbs",
    "Psalms and Proverbs",
    "psalms-proverbs",
  ],
  "faith-prayer": [
    "Faith & Prayer",
    "Faith and Prayer",
    "faith-prayer",
  ],
  "gospel-challenge": ["Gospel Challenge", "gospel-challenge"],
  "hard-questions": ["Hard Questions", "hard-questions"],
};

function normalizeCategory(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function categoryMatches(
  databaseCategory: string,
  categoryId: CategoryId
): boolean {
  const normalizedDatabaseCategory =
    normalizeCategory(databaseCategory);

  return DATABASE_CATEGORY_BY_GAME_CATEGORY[categoryId].some(
    (acceptedValue) =>
      normalizeCategory(acceptedValue) ===
      normalizedDatabaseCategory
  );
}

function mapDifficulty(value: string): Difficulty {
  const normalized = value.trim().toLowerCase();

  if (
    normalized === "hard" ||
    normalized === "hard-plus" ||
    normalized === "expert" ||
    normalized === "master" ||
    normalized === "scholar"
  ) {
    return "Hard";
  }

  if (
    normalized === "medium" ||
    normalized === "medium-plus"
  ) {
    return "Medium";
  }

  return "Easy";
}

export async function loadQuestionsForGame(
  lang: LangCode,
  categoryId: CategoryId,
  level: number
): Promise<Question[]> {
  const localQuestions = questionsForLevel(
    lang,
    categoryId,
    level
  ).questions;

  try {
    const databaseQuestions =
      await loadQuestionsForLevel(level, lang);

    const aiQuestions = databaseQuestions
      .filter((question) =>
        categoryMatches(question.category, categoryId)
      )
      .map<Question>((question) => ({
        id: question.id,
        categoryId,
        question: question.question,
        choices: question.choices,
        correctIndex:
          question.correctIndex as 0 | 1 | 2 | 3,
        reference: question.reference,
        explanation: question.explanation,
        difficulty: mapDifficulty(question.difficulty),
        level: question.level,
      }));

    console.log(
      `[Question Loader] Database: ${databaseQuestions.length}, matching AI: ${aiQuestions.length}, local: ${localQuestions.length}`
    );

    if (aiQuestions.length === 0) {
      return localQuestions;
    }

    const selectedAiQuestions = shuffle(aiQuestions).slice(
      0,
      QUESTIONS_PER_GAME
    );

    const selectedIds = new Set(
      selectedAiQuestions.map((question) => question.id)
    );

    const localFill = shuffle(
      localQuestions.filter(
        (question) => !selectedIds.has(question.id)
      )
    ).slice(
      0,
      QUESTIONS_PER_GAME - selectedAiQuestions.length
    );

    return [
      ...selectedAiQuestions,
      ...localFill,
    ].slice(0, QUESTIONS_PER_GAME);
  } catch (error) {
    console.error(
      "Database question loading failed:",
      error
    );

    return localQuestions;
  }
}
