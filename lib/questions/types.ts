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

/** Future database-ready multilingual question shape. */
export type BibleQuestion = {
  id: string;
  level: number;
  category: string;
  book: string;
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
  translations: Partial<Record<SupportedQuestionLanguage, QuestionTranslation>>;
};
