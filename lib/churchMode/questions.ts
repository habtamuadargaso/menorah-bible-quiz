import { CHURCH_MODE_LANGUAGES, type LangCode } from "@/lib/i18n/locales";
import { nativeQuestionBank, type Question } from "@/lib/questions";
import { loadQuestionsForLanguage, type LoadedQuestion } from "@/lib/questions/loadQuestions";
import { categoryIdForDatabaseCategory, mapDifficulty } from "@/lib/questions/mapDatabaseQuestion";
import type { Difficulty } from "@/lib/questions/types";
import { shuffle } from "@/lib/shuffle";

export interface ChurchQuestion extends Question {
  canonicalQuestionId: string;
  languageCode: LangCode;
  isEnglishFallback: boolean;
}

export interface ChurchQuestionSelection {
  questions: ChurchQuestion[];
  usedEnglishFallback: boolean;
}

export const churchModeLanguages = CHURCH_MODE_LANGUAGES;

function isCompleteQuestion(question: Question | undefined): question is Question {
  return Boolean(
    question &&
      question.id.trim() &&
      question.question.trim() &&
      question.choices.length === 4 &&
      question.choices.every((choice) => choice.trim()) &&
      Number.isInteger(question.correctIndex) &&
      question.correctIndex >= 0 &&
      question.correctIndex < question.choices.length,
  );
}

function fromLoaded(question: LoadedQuestion): Question {
  return {
    id: question.id,
    categoryId: categoryIdForDatabaseCategory(question.category),
    question: question.question,
    choices: question.choices,
    correctIndex: question.correctIndex as 0 | 1 | 2 | 3,
    reference: question.reference,
    explanation: question.explanation,
    difficulty: mapDifficulty(question.difficulty),
    level: question.level,
  };
}

/** Pure canonical join used by the loader and focused tests. The English
 * version is chosen for the exact same id; a different English question is
 * never substituted for a missing translation. */
export function selectChurchQuestions(
  selectedLanguage: LangCode,
  selectedQuestions: Question[],
  englishQuestions: Question[],
  difficulty: Difficulty,
  count: number,
  randomize = true,
): ChurchQuestionSelection | null {
  const selectedById = new Map(selectedQuestions.filter(isCompleteQuestion).map((question) => [question.id, question]));
  const englishById = new Map(englishQuestions.filter(isCompleteQuestion).map((question) => [question.id, question]));
  const canonicalIds = new Set([...selectedById.keys(), ...englishById.keys()]);
  const eligible: ChurchQuestion[] = [];

  for (const canonicalQuestionId of canonicalIds) {
    const native = selectedById.get(canonicalQuestionId);
    const english = englishById.get(canonicalQuestionId);
    const rendered = selectedLanguage !== "en" && native ? native : english;
    if (!rendered || rendered.difficulty !== difficulty) continue;
    const isEnglishFallback = selectedLanguage !== "en" && rendered === english;
    eligible.push({
      ...rendered,
      id: canonicalQuestionId,
      canonicalQuestionId,
      languageCode: isEnglishFallback ? "en" : selectedLanguage,
      isEnglishFallback,
    });
  }

  if (eligible.length < count) return null;
  const questions = (randomize ? shuffle(eligible) : eligible).slice(0, count);
  return { questions, usedEnglishFallback: questions.some((question) => question.isEnglishFallback) };
}

export async function loadChurchQuestions(
  selectedLanguage: LangCode,
  difficulty: Difficulty,
  count: number,
): Promise<ChurchQuestionSelection | null> {
  let selectedPublished: LoadedQuestion[] = [];
  let englishPublished: LoadedQuestion[] = [];
  try {
    [selectedPublished, englishPublished] = await Promise.all([
      selectedLanguage === "en" ? Promise.resolve([]) : loadQuestionsForLanguage(selectedLanguage),
      loadQuestionsForLanguage("en"),
    ]);
  } catch (error) {
    console.error("Church Mode: published translations unavailable; using reviewed local English questions:", error);
  }

  const selected = selectedLanguage === "en" ? [] : selectedPublished.map(fromLoaded);
  const englishById = new Map<string, Question>();
  for (const question of [...englishPublished.map(fromLoaded), ...nativeQuestionBank("en")]) {
    if (!englishById.has(question.id)) englishById.set(question.id, question);
  }
  return selectChurchQuestions(selectedLanguage, selected, [...englishById.values()], difficulty, count);
}
