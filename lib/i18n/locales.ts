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
  /** Flag emoji shown next to a player's name in the Live Battle waiting
   * room (Mission 13) and language pickers. A best-effort visual hint, not
   * a claim of national ownership over the language. */
  flag: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: "en", nativeName: "English", englishName: "English", flag: "🇺🇸" },
  { code: "am", nativeName: "አማርኛ", englishName: "Amharic", flag: "🇪🇹" },
  { code: "om", nativeName: "Afaan Oromoo", englishName: "Afaan Oromo", flag: "🇪🇹" },
  { code: "ti", nativeName: "ትግርኛ", englishName: "Tigrinya", flag: "🇪🇹" },
  { code: "es", nativeName: "Español", englishName: "Spanish", flag: "🇪🇸" },
  { code: "fr", nativeName: "Français", englishName: "French", flag: "🇫🇷" },
  { code: "ar", nativeName: "العربية", englishName: "Arabic", rtl: true, flag: "🇸🇦" },
  { code: "pt", nativeName: "Português", englishName: "Portuguese", flag: "🇵🇹" },
  { code: "sw", nativeName: "Kiswahili", englishName: "Swahili", flag: "🇹🇿" },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", flag: "🇮🇳" },
  { code: "zh", nativeName: "中文", englishName: "Chinese", flag: "🇨🇳" },
  { code: "ko", nativeName: "한국어", englishName: "Korean", flag: "🇰🇷" },
  { code: "de", nativeName: "Deutsch", englishName: "German", flag: "🇩🇪" },
  { code: "it", nativeName: "Italiano", englishName: "Italian", flag: "🇮🇹" },
  { code: "ja", nativeName: "日本語", englishName: "Japanese", flag: "🇯🇵" },
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

export function flagForLanguage(lang: LangCode): string {
  return LANGUAGES.find((l) => l.code === lang)?.flag ?? "🌐";
}
