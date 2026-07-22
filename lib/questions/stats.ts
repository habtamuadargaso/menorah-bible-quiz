import { CANONICAL_CATEGORIES, MAX_LEVEL, MIN_LEVEL, normalizeDifficultyTier } from "./canon";
import { getCanonicalQuestionStore } from "./store";
import type { BibleQuestion, CanonicalCategory, SupportedQuestionLanguage } from "./types";

export interface DifficultyCounts {
  Easy: number;
  Medium: number;
  Hard: number;
}

export interface LevelStats {
  level: number;
  byDifficulty: DifficultyCounts;
  total: number;
}

export interface LanguageStats {
  language: SupportedQuestionLanguage;
  byLevel: LevelStats[];
  total: number;
}

export interface QuestionBankStats {
  totalCanonicalQuestions: number;
  byLanguage: LanguageStats[];
}

const SUPPORTED_LANGUAGES: SupportedQuestionLanguage[] = ["en", "am"];

/** Part 9's "show totals" utility — English/Level 1/Easy/102 etc. Counts a
 * question toward a language only if it actually has a translation for
 * that language (a question with only an English translation doesn't
 * inflate Amharic's numbers). */
export function computeQuestionBankStats(questions: BibleQuestion[] = getCanonicalQuestionStore()): QuestionBankStats {
  const byLanguage: LanguageStats[] = SUPPORTED_LANGUAGES.map((language) => {
    const byLevel: LevelStats[] = [];
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level += 1) {
      const byDifficulty: DifficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
      for (const q of questions) {
        if (q.level !== level) continue;
        if (!q.translations[language]) continue;
        byDifficulty[normalizeDifficultyTier(q.difficulty)] += 1;
      }
      byLevel.push({
        level,
        byDifficulty,
        total: byDifficulty.Easy + byDifficulty.Medium + byDifficulty.Hard,
      });
    }
    return { language, byLevel, total: byLevel.reduce((sum, l) => sum + l.total, 0) };
  });

  return { totalCanonicalQuestions: questions.length, byLanguage };
}

export interface CategoryStats {
  category: CanonicalCategory;
  count: number;
}

/** Mission 5D Part 9 addition — raw counts by canonical category, across
 * the whole store regardless of language/level (one entry per question,
 * since canonicalCategory is a single controlled value per question, not
 * per-translation). */
export function computeCategoryStats(questions: BibleQuestion[] = getCanonicalQuestionStore()): CategoryStats[] {
  const counts = new Map<CanonicalCategory, number>(CANONICAL_CATEGORIES.map((c) => [c, 0]));
  for (const q of questions) {
    counts.set(q.canonicalCategory, (counts.get(q.canonicalCategory) ?? 0) + 1);
  }
  return CANONICAL_CATEGORIES.map((category) => ({ category, count: counts.get(category) ?? 0 }));
}

export interface TranslationCompletion {
  language: SupportedQuestionLanguage;
  translatedCount: number;
  totalQuestions: number;
  percent: number;
}

/** Mission 5D Part 9 addition — what fraction of the whole canonical bank
 * has a translation in each language, regardless of level/difficulty. */
export function computeTranslationCompletion(
  questions: BibleQuestion[] = getCanonicalQuestionStore()
): TranslationCompletion[] {
  const total = questions.length;
  return (["en", "am"] as SupportedQuestionLanguage[]).map((language) => {
    const translatedCount = questions.filter((q) => Boolean(q.translations[language])).length;
    return {
      language,
      translatedCount,
      totalQuestions: total,
      percent: total === 0 ? 0 : Math.round((translatedCount / total) * 1000) / 10,
    };
  });
}

/** Pretty-prints computeQuestionBankStats() in the Part 9 example format
 * (English / Level 1 / Easy 102 / Medium 101 / Hard 104 / ...). Only
 * prints levels that actually have at least one question, so an empty
 * bank doesn't spam 10 zeroed-out levels per language. */
export function formatQuestionBankStats(stats: QuestionBankStats): string {
  const lines: string[] = [`Total canonical questions: ${stats.totalCanonicalQuestions}`, ""];
  const languageNames: Record<SupportedQuestionLanguage, string> = { en: "English", am: "Amharic" };

  for (const lang of stats.byLanguage) {
    lines.push(`${languageNames[lang.language]} (${lang.total} total)`);
    const nonEmptyLevels = lang.byLevel.filter((l) => l.total > 0);
    if (nonEmptyLevels.length === 0) {
      lines.push("  (no questions yet)");
    }
    for (const level of nonEmptyLevels) {
      lines.push(`  Level ${level.level} (${level.total})`);
      lines.push(`    Easy   ${level.byDifficulty.Easy}`);
      lines.push(`    Medium ${level.byDifficulty.Medium}`);
      lines.push(`    Hard   ${level.byDifficulty.Hard}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
