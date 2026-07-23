import type { LangCode } from "@/lib/i18n/locales";
import { nativeQuestionBank, type Question } from "@/lib/questions";
import type { Difficulty } from "@/lib/questions/types";
import { shuffle } from "@/lib/shuffle";
import { FRIENDS_BATTLE_QUESTION_COUNT } from "./types";

/**
 * Friends Battle is entirely local/offline — it only ever draws from the
 * same native-language question bank solo campaign uses (never Supabase),
 * so a match can be played with no network at all. Per the project's rule
 * against silently mixing English into another selected language, this
 * never falls back to English: a language with fewer than
 * FRIENDS_BATTLE_QUESTION_COUNT native questions returns null so the setup
 * screen can show a clear "not enough content" message instead.
 */
export function friendsBattlePoolSize(lang: LangCode): number {
  return nativeQuestionBank(lang).length;
}

export function hasEnoughFriendsBattleContent(lang: LangCode): boolean {
  return friendsBattlePoolSize(lang) >= FRIENDS_BATTLE_QUESTION_COUNT;
}

/** Cheap check (no shuffling) so the setup screen can warn about the
 * difficulty fallback live, before the player even presses Start. */
export function wouldUseDifficultyFallback(lang: LangCode, difficulty: Difficulty): boolean {
  const bank = nativeQuestionBank(lang);
  const exact = bank.filter((q) => q.difficulty === difficulty);
  return exact.length < FRIENDS_BATTLE_QUESTION_COUNT;
}

export interface FriendsBattleQuestionSelection {
  questions: Question[];
  /** True when the exact-difficulty pool had fewer than
   * FRIENDS_BATTLE_QUESTION_COUNT questions and the selection had to widen
   * to the full same-language bank (still never crossing languages). The
   * setup/game screens surface this so the fallback is never silent. */
  usedDifficultyFallback: boolean;
}

/**
 * Picks FRIENDS_BATTLE_QUESTION_COUNT unique questions for one match,
 * strictly filtered by `language` and `difficulty` first.
 *
 * Note on `level`: the local question bank (lib/questions/<lang>.ts) has no
 * per-question level metadata of its own — level only exists as a runtime
 * campaign assignment computed elsewhere (questionsForLevel in
 * lib/questions/index.ts), which Friends Battle deliberately doesn't use
 * (that system enforces a strict no-repeat partition meant for solo
 * campaign progression, not a casual local match). So `level` cannot be
 * used as a real filter here without inventing content that doesn't exist;
 * it's accepted for API symmetry with the setup screen and reserved for a
 * future per-level content split, but today the selection is driven by
 * language + difficulty only.
 *
 * Fallback behavior (never silent — see usedDifficultyFallback):
 *   1. Filter the language's native bank to the exact requested difficulty.
 *   2. If that has fewer than FRIENDS_BATTLE_QUESTION_COUNT questions,
 *      widen to the full same-language bank (all difficulties combined) —
 *      this never crosses into another language.
 *   3. If even the full same-language bank has fewer than
 *      FRIENDS_BATTLE_QUESTION_COUNT questions, return null so the caller
 *      can show a clear "not enough content" message instead of ever
 *      silently mixing in English (or any other language).
 */
export function pickFriendsBattleQuestions(
  lang: LangCode,
  _level: number,
  difficulty: Difficulty
): FriendsBattleQuestionSelection | null {
  const bank = nativeQuestionBank(lang);
  if (bank.length < FRIENDS_BATTLE_QUESTION_COUNT) return null;

  const exact = bank.filter((q) => q.difficulty === difficulty);
  const usedDifficultyFallback = exact.length < FRIENDS_BATTLE_QUESTION_COUNT;
  const pool = usedDifficultyFallback ? bank : exact;
  if (pool.length < FRIENDS_BATTLE_QUESTION_COUNT) return null;

  return {
    questions: shuffle(pool).slice(0, FRIENDS_BATTLE_QUESTION_COUNT),
    usedDifficultyFallback,
  };
}
