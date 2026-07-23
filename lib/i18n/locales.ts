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
  | "it"
  | "ja";

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
  { code: "ja", nativeName: "日本語", englishName: "Japanese" },
];

export const DEFAULT_LANG: LangCode = "en";

/**
 * The full set of languages the app is configured to support — every
 * language selector (Solo Play, Friends Battle, Live Battle, Settings)
 * treats every one of these as selectable, regardless of how much
 * published question content currently exists for it (Mission 12 removed
 * the old "Coming Soon" gate that hid a language until it crossed a
 * published-question-count threshold). Content availability is a
 * gameplay-time concern (see loadQuestionsForGame.ts / liveBattleRoom.ts /
 * friendsBattle/localQuestions.ts), never a picker-time one.
 */
export const SUPPORTED_LANGUAGE_CODES: LangCode[] = LANGUAGES.map((l) => l.code);

export function isRtl(lang: LangCode): boolean {
  return LANGUAGES.find((l) => l.code === lang)?.rtl === true;
}
