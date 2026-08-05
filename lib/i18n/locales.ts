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
  /** Player-facing selectors only include entries explicitly enabled for
   * the current release. Admin translation tools may use disabled entries. */
  releaseStatus: "enabled" | "future";
  /** Church Mode may expose a question language independently from the
   * app-wide interface-language release. Missing reviewed content falls
   * back per canonical question to English. */
  churchModeEnabled: boolean;
}

/** Single registry for interface and question-language readiness. Entries can
 * exist here before they are safe to expose to players. */
export const ALL_LANGUAGES: LanguageInfo[] = [
  { code: "en", nativeName: "English", englishName: "English", flag: "🇺🇸", releaseStatus: "enabled", churchModeEnabled: true },
  { code: "am", nativeName: "አማርኛ", englishName: "Amharic", flag: "🇪🇹", releaseStatus: "enabled", churchModeEnabled: true },
  { code: "om", nativeName: "Afaan Oromoo", englishName: "Afaan Oromo", flag: "🇪🇹", releaseStatus: "future", churchModeEnabled: true },
  { code: "ti", nativeName: "ትግርኛ", englishName: "Tigrinya", flag: "🇪🇹", releaseStatus: "future", churchModeEnabled: true },
  { code: "es", nativeName: "Español", englishName: "Spanish", flag: "🇪🇸", releaseStatus: "future", churchModeEnabled: true },
  { code: "fr", nativeName: "Français", englishName: "French", flag: "🇫🇷", releaseStatus: "future", churchModeEnabled: true },
  { code: "ar", nativeName: "العربية", englishName: "Arabic", rtl: true, flag: "🇸🇦", releaseStatus: "future", churchModeEnabled: true },
  { code: "pt", nativeName: "Português", englishName: "Portuguese", flag: "🇵🇹", releaseStatus: "future", churchModeEnabled: true },
  { code: "sw", nativeName: "Kiswahili", englishName: "Swahili", flag: "🇹🇿", releaseStatus: "future", churchModeEnabled: true },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", flag: "🇮🇳", releaseStatus: "future", churchModeEnabled: true },
  { code: "zh", nativeName: "中文", englishName: "Chinese", flag: "🇨🇳", releaseStatus: "future", churchModeEnabled: true },
  { code: "ko", nativeName: "한국어", englishName: "Korean", flag: "🇰🇷", releaseStatus: "future", churchModeEnabled: true },
  { code: "de", nativeName: "Deutsch", englishName: "German", flag: "🇩🇪", releaseStatus: "future", churchModeEnabled: true },
  { code: "it", nativeName: "Italiano", englishName: "Italian", flag: "🇮🇹", releaseStatus: "future", churchModeEnabled: true },
  { code: "ja", nativeName: "日本語", englishName: "Japanese", flag: "🇯🇵", releaseStatus: "future", churchModeEnabled: true },
];

/** Player-facing v1.0 languages. All ordinary selectors consume this list. */
export const LANGUAGES: LanguageInfo[] = ALL_LANGUAGES.filter((language) => language.releaseStatus === "enabled");

/** Question languages available to Church hosts. This does not expand the
 * app-wide interface-language selector. */
export function enabledChurchModeLanguages(registry: LanguageInfo[] = ALL_LANGUAGES): LanguageInfo[] {
  return registry.filter((language) => language.churchModeEnabled);
}

export const CHURCH_MODE_LANGUAGES: LanguageInfo[] = enabledChurchModeLanguages();

export const DEFAULT_LANG: LangCode = "en";

/**
 * Languages enabled in player-facing selectors for this release.
 */
export const SUPPORTED_LANGUAGE_CODES: LangCode[] = LANGUAGES.map((l) => l.code);

/** Full future-ready registry used by protected translation/admin tools. */
export const CONFIGURED_LANGUAGE_CODES: LangCode[] = ALL_LANGUAGES.map((language) => language.code);

export function isPlayerLanguage(lang: string): lang is LangCode {
  return SUPPORTED_LANGUAGE_CODES.includes(lang as LangCode);
}

export function isRtl(lang: LangCode): boolean {
  return ALL_LANGUAGES.find((l) => l.code === lang)?.rtl === true;
}

export function flagForLanguage(lang: LangCode): string {
  return ALL_LANGUAGES.find((l) => l.code === lang)?.flag ?? "🌐";
}
