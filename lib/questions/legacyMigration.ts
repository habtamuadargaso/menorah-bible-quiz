import type { CategoryId } from "@/lib/categories";
import { QUESTIONS_EN } from "./en";
import { QUESTIONS_AM } from "./am";
import { levelForReference, testamentForBook } from "./canon";
import type { BibleQuestion, CanonicalCategory, Question, SupportedQuestionLanguage } from "./types";

/**
 * Adapter, not fabrication: lib/questions/en.ts and lib/questions/am.ts
 * predate this canonical schema and were authored completely
 * independently of each other (100 English questions vs. 10 unrelated
 * Amharic ones — verified by inspection, not assumed). Forcing them onto
 * shared canonical ids would mean guessing which English question an
 * Amharic one is "really" a translation of, with no way to know that's
 * true. So each legacy question becomes its OWN new canonical
 * BibleQuestion with only the one language it already has populated —
 * honest about what's actually known. A human editor can later merge two
 * of these under one id if they confirm they're the same question in
 * different languages; nothing here does that automatically.
 */
const CATEGORY_ID_TO_CANONICAL: Partial<Record<CategoryId, CanonicalCategory>> = {
  "old-testament": "Old Testament",
  "new-testament": "New Testament",
  "life-of-jesus": "Jesus",
  apostles: "Disciples",
  "bible-characters": "People",
  "psalms-proverbs": "Old Testament",
  "gospel-challenge": "New Testament",
  // youth-challenge, faith-prayer, hard-questions have no natural mapping —
  // fall back to the testament derived from the question's own reference.
};

function canonicalCategoryFor(categoryId: CategoryId, testament: "old" | "new" | null): CanonicalCategory {
  return CATEGORY_ID_TO_CANONICAL[categoryId] ?? (testament === "new" ? "New Testament" : "Old Testament");
}

function migrateLegacyQuestion(
  legacy: Question,
  language: SupportedQuestionLanguage,
  idPrefix: string,
  translationComplete: boolean
): BibleQuestion {
  const { book, testament, level, chapter } = levelForReference(legacy.reference);
  const resolvedTestament = testament ?? testamentForBook(book ?? "") ?? "old";

  return {
    id: `${idPrefix}-${legacy.id}`,
    level,
    category: legacy.categoryId,
    canonicalCategory: canonicalCategoryFor(legacy.categoryId, resolvedTestament),
    book: book ?? "Unknown",
    testament: resolvedTestament,
    chapter: chapter ?? undefined,
    difficulty: legacy.difficulty === "Easy" ? "easy" : legacy.difficulty === "Medium" ? "medium" : "hard",
    correctIndex: legacy.correctIndex,
    reference: legacy.reference,
    tags: [legacy.categoryId],
    // English legacy content has been live in production; Amharic is
    // explicitly flagged in am.ts as AI-drafted and not yet reviewed by a
    // native speaker — verified must reflect that, not just "it shipped".
    verified: language === "en",
    translations: {
      [language]: {
        question: legacy.question,
        choices: legacy.choices,
        explanation: legacy.explanation,
      },
    },
    translationStatus: {
      [language]: translationComplete ? "complete" : "machine",
    },
  };
}

let cachedLegacyCanonical: BibleQuestion[] | null = null;

/** All legacy lib/questions/en.ts + am.ts content, migrated into canonical
 * BibleQuestion records. Computed once and cached — the source arrays are
 * static module-level constants. */
export function legacyQuestionsAsCanonical(): BibleQuestion[] {
  if (cachedLegacyCanonical) return cachedLegacyCanonical;
  cachedLegacyCanonical = [
    ...QUESTIONS_EN.map((q) => migrateLegacyQuestion(q, "en", "legacy-en", true)),
    // am.ts's own file header flags these as AI-drafted and unreviewed by a
    // native speaker — translationStatus reflects that honestly rather
    // than claiming "complete".
    ...QUESTIONS_AM.map((q) => migrateLegacyQuestion(q, "am", "legacy-am", false)),
  ];
  return cachedLegacyCanonical;
}
