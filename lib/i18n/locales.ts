export type LangCode =
  | "en"
  | "am"
  | "om"
  | "ti"
  | "es"
  | "fr"
  | "ar"
  | "pt"
  | "sw"
  | "hi"
  | "zh"
  | "ko"
  | "de"
  | "it";

export interface LanguageInfo {
  code: LangCode;
  /** Name written in the language itself, shown in the dropdown */
  nativeName: string;
  /** English name, shown as a small hint in the dropdown */
  englishName: string;
  rtl?: boolean;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: "en", nativeName: "English", englishName: "English" },
  { code: "am", nativeName: "አማርኛ", englishName: "Amharic" },
  { code: "om", nativeName: "Afaan Oromoo", englishName: "Afaan Oromo" },
  { code: "ti", nativeName: "ትግርኛ", englishName: "Tigrinya" },
  { code: "es", nativeName: "Español", englishName: "Spanish" },
  { code: "fr", nativeName: "Français", englishName: "French" },
  { code: "ar", nativeName: "العربية", englishName: "Arabic", rtl: true },
  { code: "pt", nativeName: "Português", englishName: "Portuguese" },
  { code: "sw", nativeName: "Kiswahili", englishName: "Swahili" },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi" },
  { code: "zh", nativeName: "中文", englishName: "Chinese" },
  { code: "ko", nativeName: "한국어", englishName: "Korean" },
  { code: "de", nativeName: "Deutsch", englishName: "German" },
  { code: "it", nativeName: "Italiano", englishName: "Italian" },
];

export const DEFAULT_LANG: LangCode = "en";

/**
 * Languages that currently have a full, human-reviewable question bank.
 * All other languages fall back to the English question bank until their
 * own questions are added under lib/questions/<code>.ts.
 */
export const FULLY_TRANSLATED_QUESTION_LANGS: LangCode[] = ["en", "am"];

export function isRtl(lang: LangCode): boolean {
  return LANGUAGES.find((l) => l.code === lang)?.rtl === true;
}
