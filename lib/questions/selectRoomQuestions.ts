import type { CategoryId } from "@/lib/categories";
import { shuffle } from "@/lib/shuffle";
import { categoryMatches } from "./mapDatabaseQuestion";
import type { LoadedQuestion } from "./loadQuestions";

export interface SelectRoomQuestionsInput {
  /** Already filtered to the room's level + language + published status by
   * the caller (loadQuestionsForLevel) — this function only ever narrows
   * further, never re-checks level/language. */
  levelLanguagePool: LoadedQuestion[];
  categoryId: CategoryId;
  questionCount: number;
  /** Question ids used in the host's most recently COMPLETED room, if any
   * (Mission 14 #15) — excluded from the pool when enough alternatives
   * remain, otherwise ignored so a small pool still produces a room. */
  recentlyUsedIds: Set<string>;
}

export interface SelectRoomQuestionsResult {
  selectedQuestionIds: string[];
  /** Count after level+language filtering, before category/recency. */
  eligibleCount: number;
  /** Count after also applying the category filter. */
  categoryEligibleCount: number;
  /** True if the category-filtered pool was too small and the full
   * level+language pool was used instead (category is a best-effort
   * preference, not a hard gate — see seedRoomQuestions' doc comment for
   * why, mirroring loadQuestionsForGame.ts's existing solo-play precedent). */
  usedCategoryFallback: boolean;
  /** True if the recent-room exclusion was actually applied. */
  usedRecentExclusion: boolean;
}

/**
 * Mission 14 — replaces `dbQuestions.slice(0, questionCount)` (a
 * deterministic "first N in whatever order Postgres returned" selection,
 * with no randomization at all) with: dedupe by id (belt-and-suspenders —
 * questions.id is the DB primary key, so this should already be redundant)
 * -> best-effort category filter -> best-effort recent-room exclusion ->
 * Fisher-Yates shuffle of the FULL remaining eligible pool -> take the
 * first `questionCount`. Sampling without replacement from a pool of
 * unique ids also makes "no duplicate questions inside one match" (#14)
 * structurally guaranteed, not just incidentally true.
 */
export function selectRoomQuestionIds({
  levelLanguagePool,
  categoryId,
  questionCount,
  recentlyUsedIds,
}: SelectRoomQuestionsInput): SelectRoomQuestionsResult {
  const uniqueById = Array.from(new Map(levelLanguagePool.map((q) => [q.id, q])).values());
  const eligibleCount = uniqueById.length;

  const categoryFiltered = uniqueById.filter((q) => categoryMatches(q.category, categoryId));
  const categoryEligibleCount = categoryFiltered.length;
  const usedCategoryFallback = categoryFiltered.length < questionCount;
  const afterCategory = usedCategoryFallback ? uniqueById : categoryFiltered;

  const withoutRecent = recentlyUsedIds.size > 0 ? afterCategory.filter((q) => !recentlyUsedIds.has(q.id)) : afterCategory;
  const usedRecentExclusion = recentlyUsedIds.size > 0 && withoutRecent.length >= questionCount;
  const finalPool = usedRecentExclusion ? withoutRecent : afterCategory;

  if (finalPool.length < questionCount) {
    throw new Error(
      `This level only has ${finalPool.length} eligible question(s) published for the selected language — Online Church Mode needs at least ${questionCount}. Add more questions in Admin, or choose a different level or language.`
    );
  }

  const selectedQuestionIds = shuffle(finalPool)
    .slice(0, questionCount)
    .map((q) => q.id);

  return {
    selectedQuestionIds,
    eligibleCount,
    categoryEligibleCount,
    usedCategoryFallback,
    usedRecentExclusion,
  };
}
