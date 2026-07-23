import { createServiceRoleClient } from "@/lib/supabase/server";
import { completeLevelCount, nativeQuestionBank } from "@/lib/questions";
import { FRIENDS_BATTLE_QUESTION_COUNT } from "@/lib/friendsBattle/types";
import { LANGUAGES, type LangCode } from "./locales";

export interface LanguageAvailability {
  code: LangCode;
  nativeName: string;
  englishName: string;
  /** Solo campaign: true if either the static native bank has at least
   * one complete campaign level, OR the live DB has enough published
   * translations to plausibly form a level. This is a scoped
   * approximation of loadQuestionsForGame.ts's real per-category-per-level
   * selection, not an exact simulation of it — see WORK_LOG.md. */
  soloAvailable: boolean;
  /** Friends Battle: true if either the static native bank alone has
   * enough questions, OR there's at least one published DB translation for
   * this language (Mission 12: Friends Battle now merges published DB
   * content with the local bank — see friendsBattle/localQuestions.ts). */
  friendsBattleAvailable: boolean;
  /** Online multiplayer: true if at least one level has enough published,
   * exact-language DB translations to seed a full room (matches
   * seedRoomQuestions()'s own real requirement). */
  onlineBattleAvailable: boolean;
  /** Total published live-DB translations for this language, across all
   * levels — shown in the UI as a "how far along" signal. */
  publishedCount: number;
}

const ONLINE_BATTLE_MIN_PER_LEVEL = 10; // matches createBattleRoom's default questionCount
const SOLO_DB_MIN_TOTAL = 10; // one level's worth, minimum plausible signal

/**
 * Server-only (uses the service-role client) — never import this into a
 * client component. Client code reads the same data via the public
 * GET /api/languages/availability endpoint instead.
 */
export async function computeLanguageAvailability(): Promise<LanguageAvailability[]> {
  const supabase = createServiceRoleClient();

  const { data: statsRows, error: statsError } = await supabase.rpc("get_translation_stats");
  if (statsError) throw new Error(statsError.message);

  const publishedByLang = new Map<string, number>();
  for (const row of (statsRows ?? []) as Array<{ language_code: string; status: string; count: number }>) {
    if (row.status === "published") publishedByLang.set(row.language_code, Number(row.count));
  }

  // Per-level published counts (one more aggregate-ish query, not a
  // full-content load) — needed for onlineBattleAvailable, which requires
  // at least one level to independently have enough content, not just an
  // aggregate total spread thinly across many levels.
  const { data: perLevelRows, error: levelError } = await supabase
    .from("question_translations")
    .select("language_code, questions!inner(level, status)")
    .eq("status", "published")
    .eq("questions.status", "published");
  if (levelError) throw new Error(levelError.message);

  const perLevelCounts = new Map<string, Map<number, number>>();
  for (const row of (perLevelRows ?? []) as unknown as Array<{ language_code: string; questions: { level: number } }>) {
    const byLevel = perLevelCounts.get(row.language_code) ?? new Map<number, number>();
    byLevel.set(row.questions.level, (byLevel.get(row.questions.level) ?? 0) + 1);
    perLevelCounts.set(row.language_code, byLevel);
  }

  return LANGUAGES.map((lang) => {
    const publishedCount = publishedByLang.get(lang.code) ?? 0;
    const levels = perLevelCounts.get(lang.code);
    const onlineBattleAvailable = levels ? Array.from(levels.values()).some((count) => count >= ONLINE_BATTLE_MIN_PER_LEVEL) : false;

    return {
      code: lang.code,
      nativeName: lang.nativeName,
      englishName: lang.englishName,
      soloAvailable: completeLevelCount(lang.code) > 0 || publishedCount >= SOLO_DB_MIN_TOTAL,
      friendsBattleAvailable: nativeQuestionBank(lang.code).length >= FRIENDS_BATTLE_QUESTION_COUNT || publishedCount > 0,
      onlineBattleAvailable,
      publishedCount,
    };
  });
}
