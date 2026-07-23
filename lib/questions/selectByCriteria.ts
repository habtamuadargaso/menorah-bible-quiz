import { normalizeDifficultyTier } from "./canon";
import { getCanonicalQuestionStore } from "./store";
import type { BibleQuestion, SupportedQuestionLanguage } from "./types";

export type SimpleDifficulty = "Easy" | "Medium" | "Hard";

export interface SelectByCriteriaOptions {
  language: SupportedQuestionLanguage;
  level: number;
  difficulty: SimpleDifficulty;
  count?: number;
  /** Never repeat these within the same match (Part 5). */
  excludeIds?: string[];
}

/**
 * Selects from the FULL canonical store (Part 1-9's architecture) by
 * language + level + difficulty — the capability Parts 10-12 ask Friends
 * Battle / Live Battle / Single Player to eventually use.
 *
 * Deliberately NOT called from any of those three today — see the Mission
 * 5C report's migration plan for why wiring them is a separate, carefully
 * regression-tested follow-up rather than bundled into this architecture
 * change. This function exists so that follow-up has a real, tested
 * target to call.
 *
 * Mirrors selectLevelQuestions()'s no-repeat-when-possible behavior: if
 * excluding already-seen questions would leave fewer than `count`
 * available, it falls back to the full matching pool rather than failing
 * the match (Part 5: "prefer not repeating", not "never allow a repeat at
 * any cost").
 */
export function selectQuestionsByCriteria(
  { language, level, difficulty, count = 10, excludeIds = [] }: SelectByCriteriaOptions,
  pool: BibleQuestion[] = getCanonicalQuestionStore()
): BibleQuestion[] | null {
  const matching = pool.filter(
    (q) => q.level === level && normalizeDifficultyTier(q.difficulty) === difficulty && Boolean(q.translations[language])
  );
  if (matching.length < count) return null;

  const unseen = matching.filter((q) => !excludeIds.includes(q.id));
  const source = unseen.length >= count ? unseen : matching;

  return shuffle(source).slice(0, count);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
