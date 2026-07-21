import { CANONICAL_CATEGORIES, MAX_LEVEL, MIN_LEVEL } from "./canon";
import type { BibleQuestion, SupportedQuestionLanguage } from "./types";

const VALID_DIFFICULTIES = new Set<BibleQuestion["difficulty"]>([
  "very-easy",
  "easy",
  "easy-plus",
  "medium",
  "medium-plus",
  "hard",
  "hard-plus",
  "expert",
  "master",
  "scholar",
]);

const SUPPORTED_LANGUAGES: SupportedQuestionLanguage[] = ["en", "am"];

export interface ValidationIssue {
  questionId: string;
  severity: "error" | "warning";
  code:
    | "duplicate-id"
    | "duplicate-wording"
    | "missing-answer"
    | "wrong-answer-index"
    | "missing-reference"
    | "missing-explanation"
    | "missing-translation"
    | "invalid-category"
    | "invalid-difficulty"
    | "invalid-level";
  message: string;
}

export interface ValidationReport {
  totalQuestions: number;
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
  isClean: boolean;
}

/**
 * Part 7's quality gate. Runs over any BibleQuestion[] — the existing
 * canonical store, or a candidate batch an importer is about to accept.
 * Never throws; always returns a full report so a caller can decide what
 * to do with warnings vs. hard errors (the importer below treats any
 * `error`-severity issue as a rejection).
 */
export function validateQuestionBank(questions: BibleQuestion[]): ValidationReport {
  const issues: ValidationIssue[] = [];
  const seenIds = new Map<string, number>();
  const seenWordingByLang = new Map<SupportedQuestionLanguage, Map<string, string>>();

  for (const q of questions) {
    const idCount = (seenIds.get(q.id) ?? 0) + 1;
    seenIds.set(q.id, idCount);
    if (idCount > 1) {
      issues.push({
        questionId: q.id,
        severity: "error",
        code: "duplicate-id",
        message: `questionId "${q.id}" is used by more than one question — ids must be unique across the whole bank.`,
      });
    }

    if (!Number.isInteger(q.level) || q.level < MIN_LEVEL || q.level > MAX_LEVEL) {
      issues.push({
        questionId: q.id,
        severity: "error",
        code: "invalid-level",
        message: `level ${q.level} is outside the valid range ${MIN_LEVEL}-${MAX_LEVEL}.`,
      });
    }

    if (!VALID_DIFFICULTIES.has(q.difficulty)) {
      issues.push({
        questionId: q.id,
        severity: "error",
        code: "invalid-difficulty",
        message: `difficulty "${q.difficulty}" is not one of the recognized difficulty tiers.`,
      });
    }

    if (!CANONICAL_CATEGORIES.includes(q.canonicalCategory)) {
      issues.push({
        questionId: q.id,
        severity: "error",
        code: "invalid-category",
        message: `canonicalCategory "${q.canonicalCategory}" is not in the controlled category list.`,
      });
    }

    if (!q.reference || !q.reference.trim()) {
      issues.push({
        questionId: q.id,
        severity: "error",
        code: "missing-reference",
        message: "Missing bibleReference.",
      });
    }

    if (![0, 1, 2, 3].includes(q.correctIndex)) {
      issues.push({
        questionId: q.id,
        severity: "error",
        code: "wrong-answer-index",
        message: `correctIndex ${q.correctIndex} must be 0, 1, 2, or 3.`,
      });
    }

    const translationEntries = Object.entries(q.translations) as Array<
      [SupportedQuestionLanguage, NonNullable<BibleQuestion["translations"][SupportedQuestionLanguage]>]
    >;

    if (translationEntries.length === 0) {
      issues.push({
        questionId: q.id,
        severity: "error",
        code: "missing-translation",
        message: "Has no translations in any language at all.",
      });
    }

    for (const [lang, translation] of translationEntries) {
      if (!translation.choices || translation.choices.length !== 4 || translation.choices.some((c) => !c?.trim())) {
        issues.push({
          questionId: q.id,
          severity: "error",
          code: "missing-answer",
          message: `[${lang}] must have exactly 4 non-empty answer choices.`,
        });
      }
      if (!translation.explanation || !translation.explanation.trim()) {
        issues.push({
          questionId: q.id,
          severity: "error",
          code: "missing-explanation",
          message: `[${lang}] is missing its explanation.`,
        });
      }
      if (!translation.question || !translation.question.trim()) {
        issues.push({
          questionId: q.id,
          severity: "error",
          code: "missing-translation",
          message: `[${lang}] translation has an empty question string.`,
        });
        continue;
      }

      if (!seenWordingByLang.has(lang)) seenWordingByLang.set(lang, new Map());
      const wordingMap = seenWordingByLang.get(lang)!;
      const normalizedWording = translation.question.trim().toLowerCase().replace(/\s+/g, " ");
      const existingId = wordingMap.get(normalizedWording);
      if (existingId && existingId !== q.id) {
        issues.push({
          questionId: q.id,
          severity: "warning",
          code: "duplicate-wording",
          message: `[${lang}] question text is nearly identical to "${existingId}" — likely a duplicate rather than a new question.`,
        });
      } else {
        wordingMap.set(normalizedWording, q.id);
      }
    }

    // Missing-translation warning: known-supported languages this
    // question hasn't been translated into yet. Not an error — most
    // questions legitimately won't have every language yet — but worth
    // surfacing for translationStatus/stats purposes.
    for (const lang of SUPPORTED_LANGUAGES) {
      if (!q.translations[lang]) {
        issues.push({
          questionId: q.id,
          severity: "warning",
          code: "missing-translation",
          message: `No ${lang} translation yet (translationStatus should be "missing").`,
        });
      }
    }
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  return {
    totalQuestions: questions.length,
    issues,
    errorCount,
    warningCount,
    isClean: errorCount === 0,
  };
}
