import { QUESTION_BANK } from "./questionBank";
import { legacyQuestionsAsCanonical } from "./legacyMigration";
import type { BibleQuestion } from "./types";

let cachedStore: BibleQuestion[] | null = null;

/**
 * The full canonical question store: hand-authored QUESTION_BANK entries
 * plus every legacy lib/questions/en.ts / am.ts question migrated into
 * canonical form. This is additive only — nothing here mutates or removes
 * lib/questions/en.ts, am.ts, or index.ts, so every existing gameplay path
 * (solo campaign, Live Battle's local fallback, Friends Battle) keeps
 * working exactly as it did before this module existed. See the Mission
 * 5C report for the concrete plan to have those paths actually consume
 * this store instead of the legacy arrays directly.
 */
export function getCanonicalQuestionStore(): BibleQuestion[] {
  if (cachedStore) return cachedStore;
  cachedStore = [...QUESTION_BANK, ...legacyQuestionsAsCanonical()];
  return cachedStore;
}

/** Test/import-time escape hatch — clears the memoized store so a freshly
 * imported question set is picked up without a process restart. */
export function invalidateCanonicalQuestionStoreCache(): void {
  cachedStore = null;
}
