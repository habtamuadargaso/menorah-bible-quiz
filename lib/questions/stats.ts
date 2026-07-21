import { MAX_LEVEL, MIN_LEVEL, normalizeDifficultyTier } from "./canon";
import { getCanonicalQuestionStore } from "./store";
import type { BibleQuestion, SupportedQuestionLanguage } from "./types";

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
