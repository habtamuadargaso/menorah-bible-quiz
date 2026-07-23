import type { LangCode } from "@/lib/i18n/locales";
import type { CategoryId } from "@/lib/categories";
import type { Question } from "./types";
import { QUESTIONS_PER_LEVEL, MAX_GAME_LEVEL } from "@/lib/levels";
import { shuffle } from "@/lib/shuffle";

import { QUESTIONS_EN } from "./en";
import { QUESTIONS_AM } from "./am";
import { QUESTIONS_OM } from "./om";
import { QUESTIONS_TI } from "./ti";
import { QUESTIONS_ES } from "./es";
import { QUESTIONS_FR } from "./fr";
import { QUESTIONS_AR } from "./ar";
import { QUESTIONS_PT } from "./pt";
import { QUESTIONS_SW } from "./sw";
import { QUESTIONS_HI } from "./hi";
import { QUESTIONS_ZH } from "./zh";
import { QUESTIONS_KO } from "./ko";
import { QUESTIONS_DE } from "./de";
import { QUESTIONS_IT } from "./it";
import { QUESTIONS_JA } from "./ja";

export type { Question } from "./types";

const QUESTIONS_BY_LANG: Record<LangCode, Question[]> = {
  en: QUESTIONS_EN,
  am: QUESTIONS_AM,
  om: QUESTIONS_OM,
  ti: QUESTIONS_TI,
  es: QUESTIONS_ES,
  fr: QUESTIONS_FR,
  ar: QUESTIONS_AR,
  pt: QUESTIONS_PT,
  sw: QUESTIONS_SW,
  hi: QUESTIONS_HI,
  zh: QUESTIONS_ZH,
  ko: QUESTIONS_KO,
  de: QUESTIONS_DE,
  it: QUESTIONS_IT,
  ja: QUESTIONS_JA,
};

export interface CategoryQuestions {
  questions: Question[];
  /** True when the selected language does not yet contain all 100 launch questions. */
  usedFallback: boolean;
}

/**
 * Returns native questions only. The game never silently mixes English into a
 * different selected language.
 */
export function questionsForCategory(
  lang: LangCode,
  categoryId: CategoryId
): CategoryQuestions {
  const native = (QUESTIONS_BY_LANG[lang] ?? []).filter(
    (question) => question.categoryId === categoryId
  );

  return {
    questions: native,
    usedFallback: lang !== "en" && native.length < QUESTIONS_PER_LEVEL,
  };
}

/** Small deterministic hash used to create a stable campaign order. */
function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededOrder<T>(items: T[], seedText: string): T[] {
  const copy = [...items];
  let seed = hashSeed(seedText) || 1;

  function nextRandom() {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  }

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(nextRandom() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

/**
 * Creates ten permanently separated campaign levels from one language bank.
 *
 * Rules:
 * - Exactly ten question IDs are assigned to each level.
 * - A question can appear in only one level of the same category campaign.
 * - Replaying a level may change display order, but not its question set.
 * - A language with fewer than the required questions exposes only complete levels.
 */
export function questionsForLevel(
  lang: LangCode,
  categoryId: CategoryId,
  level: number
): CategoryQuestions {
  const categoryBank = (QUESTIONS_BY_LANG[lang] ?? []).filter(
    (question) => question.categoryId === categoryId
  );

  if (level < 1 || level > MAX_GAME_LEVEL || categoryBank.length < QUESTIONS_PER_LEVEL) {
    return { questions: [], usedFallback: lang !== "en" };
  }

  // The selected category changes the campaign ordering while preserving a
  // strict no-repeat guarantee between Level 1 through Level 10.
  const ordered = seededOrder(categoryBank, `${lang}:${categoryId}:campaign-v1`);
  const start = (level - 1) * QUESTIONS_PER_LEVEL;
  const levelPool = ordered.slice(start, start + QUESTIONS_PER_LEVEL);

  if (levelPool.length < QUESTIONS_PER_LEVEL) {
    return {
      questions: [],
      usedFallback: lang !== "en" || categoryBank.length < MAX_GAME_LEVEL * QUESTIONS_PER_LEVEL,
    };
  }

  return {
    questions: shuffle(levelPool).map((question) => ({ ...question, level })),
    usedFallback: lang !== "en" && categoryBank.length < MAX_GAME_LEVEL * QUESTIONS_PER_LEVEL,
  };
}

export function questionCountForCategory(
  lang: LangCode,
  categoryId: CategoryId
): number {
  return questionsForCategory(lang, categoryId).questions.length;
}

export function completeLevelCount(lang: LangCode): number {
  return Math.min(
    MAX_GAME_LEVEL,
    Math.floor((QUESTIONS_BY_LANG[lang] ?? []).length / QUESTIONS_PER_LEVEL)
  );
}

/** Returns a native-language question by its permanent ID. */
export function questionById(lang: LangCode, questionId: string): Question | null {
  return (QUESTIONS_BY_LANG[lang] ?? []).find((question) => question.id === questionId) ?? null;
}

/** Exposes a read-only copy for host-side room seeding and content audits. */
export function nativeQuestionBank(lang: LangCode): Question[] {
  return [...(QUESTIONS_BY_LANG[lang] ?? [])];
}
