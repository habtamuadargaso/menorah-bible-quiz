// Mission 10: re-exports the app's one central language registry
// (lib/i18n/locales.ts's LangCode) instead of maintaining a second,
// independently-hand-written list — this file used to define its own
// 15-language union that had drifted slightly out of sync with LangCode
// (it included "ja" before LangCode did). Now there is exactly one place
// that lists supported languages.
export type { LangCode as SupportedLanguage } from "@/lib/i18n/locales";
import type { LangCode as SupportedLanguage } from "@/lib/i18n/locales";

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