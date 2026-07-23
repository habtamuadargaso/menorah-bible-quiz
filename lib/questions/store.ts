import { QUESTION_BANK } from "./questionBank";
import { legacyQuestionsAsCanonical } from "./legacyMigration";
import { LEVEL_1_EXPANSION_EN } from "./expansion/level1";
import { LEVEL_2_EXPANSION_EN } from "./expansion/level2";
import { LEVEL_3_EXPANSION_EN } from "./expansion/level3";
import { LEVEL_4_EXPANSION_EN } from "./expansion/level4";
import { LEVEL_5_EXPANSION_EN } from "./expansion/level5";
import { LEVEL_6_EXPANSION_EN } from "./expansion/level6";
import { LEVEL_7_EXPANSION_EN } from "./expansion/level7";
import { LEVEL_8_EXPANSION_EN } from "./expansion/level8";
import { LEVEL_9_EXPANSION_EN } from "./expansion/level9";
import { LEVEL_10_EXPANSION_EN } from "./expansion/level10";
import type { BibleQuestion } from "./types";

/** Mission 5D expansion batches — new canonical questions filling
 * language/level/difficulty gaps identified by stats.ts. Each is
 * verified: false (AI-authored, pending human review) and additive only,
 * same as the rest of this store. */
const EXPANSION_BATCHES: BibleQuestion[] = [
  ...LEVEL_1_EXPANSION_EN,
  ...LEVEL_2_EXPANSION_EN,
  ...LEVEL_3_EXPANSION_EN,
  ...LEVEL_4_EXPANSION_EN,
  ...LEVEL_5_EXPANSION_EN,
  ...LEVEL_6_EXPANSION_EN,
  ...LEVEL_7_EXPANSION_EN,
  ...LEVEL_8_EXPANSION_EN,
  ...LEVEL_9_EXPANSION_EN,
  ...LEVEL_10_EXPANSION_EN,
];

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
  cachedStore = [...QUESTION_BANK, ...legacyQuestionsAsCanonical(), ...EXPANSION_BATCHES];
  return cachedStore;
}

/** Test/import-time escape hatch — clears the memoized store so a freshly
 * imported question set is picked up without a process restart. */
export function invalidateCanonicalQuestionStoreCache(): void {
  cachedStore = null;
}
