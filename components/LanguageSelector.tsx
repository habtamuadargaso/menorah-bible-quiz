"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/i18n/locales";
import { useLanguageAvailability } from "@/lib/i18n/useLanguageAvailability";

// Player-facing selectors use the release-enabled subset from locales.ts.
// Future languages remain available to protected translation tooling but
// cannot leak into Version 1.0 discovery or settings controls.
export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();
  const { availability } = useLanguageAvailability();
  const byCode = new Map((availability ?? []).map((a) => [a.code, a]));

  return (
    <select
      aria-label="Select language"
      value={lang}
      onChange={(event) => setLang(event.target.value as typeof lang)}
      className="min-h-[44px] cursor-pointer rounded-full border border-gold-500/30 bg-white/5 px-3 py-1.5 text-sm font-medium text-gold-300 outline-none transition-colors hover:border-gold-500/60 focus:border-gold-500"
    >
      {LANGUAGES.map((language) => {
        const hasLiveContent = (byCode.get(language.code)?.publishedCount ?? 0) > 0;
        return (
          <option key={language.code} value={language.code} className="bg-navy-900 text-[#f3efe2]">
            {language.nativeName} ({language.englishName}){hasLiveContent ? " •" : ""}
          </option>
        );
      })}
    </select>
  );
}
