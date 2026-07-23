export type Difficulty = "Easy" | "Medium" | "Hard";

export type Question = {
  id: string;
  categoryId: import("@/lib/categories").CategoryId;
  question: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  reference: string;
  explanation: string;
  difficulty: Difficulty;
  /** Runtime campaign assignment. Each question belongs to one level per campaign. */
  level?: number;
};

export type SupportedQuestionLanguage = "en" | "am";

export type QuestionTranslation = {
  question: string;
  choices: [string, string, string, string];
  explanation: string;
};

export type Testament = "old" | "new";

/** Whether a translation is ready to show a real player, still machine/AI
 * drafted pending human review, or simply doesn't exist yet for this
 * canonical question. Mirrors CLAUDE.md's rule that generated content
 * stays draft until a human approves it. */
export type TranslationStatus = "complete" | "machine" | "missing";

/**
 * Broad, controlled classification (see CANONICAL_CATEGORIES in canon.ts).
 * Deliberately separate from the free-form `category` field BibleQuestion
 * already used for narrative-arc labels like "Creation" or "Moses" — those
 * move to `tags` below; this field is the small fixed taxonomy the
 * question bank's stats/validator/filtering are built around.
 */
export type CanonicalCategory =
  | "People"
  | "Places"
  | "Miracles"
  | "Parables"
  | "Prophecy"
  | "Law"
  | "Kings"
  | "Judges"
  | "Disciples"
  | "Women"
  | "Paul"
  | "Jesus"
  | "Old Testament"
  | "New Testament";

/** Future database-ready multilingual question shape. One canonical `id`
 * represents the SAME question across every language — languages are
 * translations of this one record, never separate questions with their
 * own ids (see lib/questions/canon.ts for the full architecture notes). */
export type BibleQuestion = {
  id: string;
  level: number;
  /** Narrative-arc / topical label carried over from the original seed
   * data (e.g. "Creation", "Noah", "Moses"). Free-form by design — the
   * controlled classification is `canonicalCategory` below. */
  category: string;
  canonicalCategory: CanonicalCategory;
  book: string;
  testament: Testament;
  chapter?: number;
  difficulty:
    | "very-easy"
    | "easy"
    | "easy-plus"
    | "medium"
    | "medium-plus"
    | "hard"
    | "hard-plus"
    | "expert"
    | "master"
    | "scholar";
  correctIndex: 0 | 1 | 2 | 3;
  reference: string;
  /** Free-form search/filter tags — narrative arcs, themes, whatever the
   * legacy `category` values already were, plus anything future authors
   * add. Not validated against a fixed list on purpose. */
  tags: string[];
  /** True once a human has reviewed this question (content accuracy,
   * doctrine, translation quality) and approved it for players. AI/machine
   * -drafted content must stay `false` until that review happens — see
   * CLAUDE.md's rule against auto-publishing generated Bible content. */
  verified: boolean;
  translations: Partial<Record<SupportedQuestionLanguage, QuestionTranslation>>;
  /** Per-language review state — independent of `verified` (which is
   * about the canonical facts: reference, correct answer, category). A
   * question can have verified=true facts but a translation still
   * "machine" pending a native-speaker pass. */
  translationStatus: Partial<Record<SupportedQuestionLanguage, TranslationStatus>>;
};
