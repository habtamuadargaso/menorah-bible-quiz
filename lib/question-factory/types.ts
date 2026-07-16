export type SupportedLanguage =
  | "en"
  | "am"
  | "om"
  | "ti"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "pt"
  | "ar"
  | "sw"
  | "hi"
  | "zh"
  | "ja"
  | "ko";

export type GeneratedTranslation = {
  languageCode: SupportedLanguage;
  question: string;
  correctAnswer: string;
  wrongAnswers: [string, string, string];
  explanation: string;
  reflection?: string;
};

export type GeneratedQuestion = {
  book: string;
  chapter: number | null;
  category: string;
  level: number;
  difficulty: string;
  reference: string;
  translations: GeneratedTranslation[];
};

export type GenerateQuestionsInput = {
  level: number;
  count: number;
  book: string;
  chapter: number | null;
  category: string;
  difficulty: string;
  languages: SupportedLanguage[];
};