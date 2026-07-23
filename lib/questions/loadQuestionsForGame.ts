import type { CategoryId } from "@/lib/categories";
import type { LangCode } from "@/lib/i18n/locales";
import type {
  Question,
} from "@/lib/questions/types";

import { shuffle } from "@/lib/shuffle";
import { loadQuestionsForLevel } from "./loadQuestions";
import { nativeQuestionBank, questionsForLevel } from "./index";
import { categoryMatches, mapDifficulty } from "./mapDatabaseQuestion";

const QUESTIONS_PER_GAME = 10;

export async function loadQuestionsForGame(
  lang: LangCode,
  categoryId: CategoryId,
  level: number
): Promise<Question[]> {
  const categoryLevelQuestions = questionsForLevel(
    lang,
    categoryId,
    level
  ).questions;

  // Keep category-pure campaign rounds whenever a complete category level exists.
  // Some launch languages currently have only one question per category but do
  // have ten valid native-language questions in total. Preserve their existing
  // Level 1 experience by using that native bank only when the category level
  // cannot form a complete round. English and all complete category banks remain
  // strictly category-filtered.
  const nativeLevelOneFallback =
    level === 1 && categoryLevelQuestions.length < QUESTIONS_PER_GAME
      ? shuffle(nativeQuestionBank(lang)).slice(0, QUESTIONS_PER_GAME)
      : [];

  const localQuestions =
    categoryLevelQuestions.length === QUESTIONS_PER_GAME
      ? categoryLevelQuestions
      : nativeLevelOneFallback.length === QUESTIONS_PER_GAME
      ? nativeLevelOneFallback.map((question) => ({ ...question, level }))
      : [];

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

    const combined = [
      ...selectedAiQuestions,
      ...localFill,
    ].slice(0, QUESTIONS_PER_GAME);

    // Same "complete round or nothing" rule questionsForLevel already
    // enforces for the local bank — never hand QuizCard a partial round.
    return combined.length === QUESTIONS_PER_GAME ? combined : [];
  } catch (error) {
    console.error(
      "Database question loading failed:",
      error
    );

    return localQuestions;
  }
}
