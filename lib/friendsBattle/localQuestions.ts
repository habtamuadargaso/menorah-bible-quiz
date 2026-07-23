import type { LangCode } from "@/lib/i18n/locales";
import { nativeQuestionBank, type Question } from "@/lib/questions";
import type { Difficulty } from "@/lib/questions/types";
import { shuffle } from "@/lib/shuffle";
import { loadQuestionsForLanguage } from "@/lib/questions/loadQuestions";
import { categoryIdForDatabaseCategory, mapDifficulty } from "@/lib/questions/mapDatabaseQuestion";
import { FRIENDS_BATTLE_QUESTION_COUNT } from "./types";

/**
 * Mission 12: Friends Battle used to be entirely local/offline — it only
 * ever drew from the static native-language question bank (never
 * Supabase). It now also merges in published question_translations rows
 * for the selected language (see loadFriendsBattleQuestionBank below), the
 * same way Solo Play's loadQuestionsForGame.ts already does, so a language
 * that only has real content via the AI Question Factory / Global
 * Translations (not yet in the static bank files) is still playable here.
 * The local bank remains the offline fallback: if the DB is unreachable or
 * has nothing published for this language, Friends Battle still works from
 * the static bank alone. Per the project's rule against silently mixing
 * English into another selected language, this never falls back to
 * English — a language with too little combined content (local + DB)
 * simply can't start a match, surfaced as a clear message instead.
 */
export function friendsBattlePoolSize(lang: LangCode): number {
  return nativeQuestionBank(lang).length;
}

/** Local-bank-only check — used for the setup screen's pre-flight
 * difficulty-fallback hint, which needs a synchronous answer as the player
 * changes the difficulty dropdown. The real, authoritative check (local +
 * published DB content combined) happens in pickFriendsBattleQuestions
 * when the match actually starts. */
export function hasEnoughFriendsBattleContent(lang: LangCode): boolean {
  return friendsBattlePoolSize(lang) >= FRIENDS_BATTLE_QUESTION_COUNT;
}

/** Merges the static local bank with published, exact-language DB
 * translations (all levels — Friends Battle has never partitioned by
 * level, see the note on `level` below) into one flat pool of `Question`s.
 * Never throws: a DB error (offline, RLS, etc.) just means the merged pool
 * is local-only, matching Friends Battle's original offline-first
 * guarantee. */
async function loadFriendsBattleQuestionBank(lang: LangCode): Promise<Question[]> {
  const localBank = nativeQuestionBank(lang);

  let dbQuestions: Question[] = [];
  try {
    const loaded = await loadQuestionsForLanguage(lang);
    dbQuestions = loaded.map((q) => ({
      id: q.id,
      categoryId: categoryIdForDatabaseCategory(q.category),
      question: q.question,
      choices: q.choices,
      correctIndex: q.correctIndex as 0 | 1 | 2 | 3,
      reference: q.reference,
      explanation: q.explanation,
      difficulty: mapDifficulty(q.difficulty),
      level: q.level,
    }));
  } catch (error) {
    console.error("Friends Battle: loading published DB questions failed, falling back to the local bank only:", error);
  }

  // Local-bank ids and question_translations ids come from unrelated
  // schemes, so a collision shouldn't happen in practice — de-duping by id
  // anyway protects the invariant regardless of how either store's ids
  // evolve.
  const seenIds = new Set<string>();
  const bank: Question[] = [];
  for (const question of [...dbQuestions, ...localBank]) {
    if (seenIds.has(question.id)) continue;
    seenIds.add(question.id);
    bank.push(question);
  }
  return bank;
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
 *   1. Filter the language's combined bank (local + published DB) to the
 *      exact requested difficulty.
 *   2. If that has fewer than FRIENDS_BATTLE_QUESTION_COUNT questions,
 *      widen to the full same-language combined bank (all difficulties
 *      combined) — this never crosses into another language.
 *   3. If even the full same-language combined bank has fewer than
 *      FRIENDS_BATTLE_QUESTION_COUNT questions, return null so the caller
 *      can show a clear "not enough content" message instead of ever
 *      silently mixing in English (or any other language).
 */
export async function pickFriendsBattleQuestions(
  lang: LangCode,
  _level: number,
  difficulty: Difficulty
): Promise<FriendsBattleQuestionSelection | null> {
  const bank = await loadFriendsBattleQuestionBank(lang);
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
