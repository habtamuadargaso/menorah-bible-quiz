import { createServiceRoleClient } from "@/lib/supabase/server";
import { completeLevelCount, nativeQuestionBank } from "@/lib/questions";
import { FRIENDS_BATTLE_QUESTION_COUNT } from "@/lib/friendsBattle/types";
import { MAX_GAME_LEVEL, difficultyForLevel } from "@/lib/levels";
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

export interface LevelEligibilityRow {
  level: number;
  difficulty: "Easy" | "Medium" | "Hard";
  /** Published questions at this level, independent of language (a
   * question with zero published translations still counts here). */
  publishedQuestionCount: number;
  /** Published, exact-language translations at this level whose parent
   * question is also published — same query seedRoomQuestions() itself
   * runs (loadQuestionsForLevel), before Mission 14's category/shuffle
   * layer narrows it further. This is the number that actually bounds how
   * many unique questions a Live Battle room at this level+language can
   * ever draw from. */
  gameplayEligibleCount: number;
}

export interface TranslationStatusBreakdown {
  aiDraft: number;
  needsReview: number;
  approved: number;
  published: number;
  rejected: number;
  archived: number;
}

export interface LiveBattleEligibility {
  code: LangCode;
  nativeName: string;
  englishName: string;
  levels: LevelEligibilityRow[];
  /** Mission 14 #19: distinguishes draft / pending review / published
   * translation for this language, independent of level. Per-level status
   * breakdowns aren't available without a new RPC (get_translation_stats
   * only groups by language+status, not level) — the per-level table above
   * already answers the question that actually matters for room creation
   * (how many questions are truly gameplay-eligible), so that gap is
   * documented rather than closed with a new migration. */
  translationStatus: TranslationStatusBreakdown;
}

/**
 * Mission 14 Part C — admin-only, exact (not threshold/boolean) eligibility
 * counts per language × level, plus the translation review pipeline's
 * status breakdown per language. Backs the "Live Battle Eligibility" admin
 * tab so publishing new questions/translations can be verified to actually
 * be gameplay-eligible, not just present somewhere in the review pipeline.
 */
export async function computeLiveBattleEligibility(): Promise<LiveBattleEligibility[]> {
  const supabase = createServiceRoleClient();

  const { data: statsRows, error: statsError } = await supabase.rpc("get_translation_stats");
  if (statsError) throw new Error(statsError.message);

  const statusByLang = new Map<string, TranslationStatusBreakdown>();
  for (const row of (statsRows ?? []) as Array<{ language_code: string; status: string; count: number }>) {
    const entry =
      statusByLang.get(row.language_code) ??
      ({ aiDraft: 0, needsReview: 0, approved: 0, published: 0, rejected: 0, archived: 0 } satisfies TranslationStatusBreakdown);
    const count = Number(row.count);
    if (row.status === "ai_draft") entry.aiDraft += count;
    else if (row.status === "needs_review") entry.needsReview += count;
    else if (row.status === "approved") entry.approved += count;
    else if (row.status === "published") entry.published += count;
    else if (row.status === "rejected") entry.rejected += count;
    else if (row.status === "archived") entry.archived += count;
    statusByLang.set(row.language_code, entry);
  }

  // Published-question counts per level, language-independent (a question
  // with zero translations still counts here — surfaces "content exists
  // but nobody's translated it yet" as distinct from "no content at all").
  const { data: questionRows, error: questionError } = await supabase.from("questions").select("level").eq("status", "published");
  if (questionError) throw new Error(questionError.message);
  const publishedQuestionsByLevel = new Map<number, number>();
  for (const row of (questionRows ?? []) as Array<{ level: number }>) {
    publishedQuestionsByLevel.set(row.level, (publishedQuestionsByLevel.get(row.level) ?? 0) + 1);
  }

  // Gameplay-eligible counts per language × level — published translation
  // whose parent question is also published, exactly seedRoomQuestions()'s
  // own bar (loadQuestionsForLevel), before the per-room category filter.
  const { data: perLevelRows, error: levelError } = await supabase
    .from("question_translations")
    .select("language_code, questions!inner(level, status)")
    .eq("status", "published")
    .eq("questions.status", "published");
  if (levelError) throw new Error(levelError.message);

  const eligibleByLangLevel = new Map<string, Map<number, number>>();
  for (const row of (perLevelRows ?? []) as unknown as Array<{ language_code: string; questions: { level: number } }>) {
    const byLevel = eligibleByLangLevel.get(row.language_code) ?? new Map<number, number>();
    byLevel.set(row.questions.level, (byLevel.get(row.questions.level) ?? 0) + 1);
    eligibleByLangLevel.set(row.language_code, byLevel);
  }

  return LANGUAGES.map((lang) => {
    const eligibleLevels = eligibleByLangLevel.get(lang.code);
    const levels: LevelEligibilityRow[] = Array.from({ length: MAX_GAME_LEVEL }, (_, i) => {
      const level = i + 1;
      return {
        level,
        difficulty: difficultyForLevel(level),
        publishedQuestionCount: publishedQuestionsByLevel.get(level) ?? 0,
        gameplayEligibleCount: eligibleLevels?.get(level) ?? 0,
      };
    });

    return {
      code: lang.code,
      nativeName: lang.nativeName,
      englishName: lang.englishName,
      levels,
      translationStatus:
        statusByLang.get(lang.code) ?? { aiDraft: 0, needsReview: 0, approved: 0, published: 0, rejected: 0, archived: 0 },
    };
  });
}
