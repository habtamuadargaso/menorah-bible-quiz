"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/i18n/locales";
import { useLanguageAvailability } from "@/lib/i18n/useLanguageAvailability";

// Mission 10: this is the "Solo Quiz" language selector (see
// LanguageModal.tsx's own copy) — gated by soloAvailable from the central
// availability registry instead of the old hardcoded
// FULLY_TRANSLATED_QUESTION_LANGS allowlist. While the availability fetch
// is in flight, only the two languages already known-good from the start
// (English/Amharic) are treated as available — never assume a language IS
// available before we've actually confirmed it.
export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();
  const { availability, loading } = useLanguageAvailability();
  const byCode = new Map((availability ?? []).map((a) => [a.code, a]));

  return (
    <select
      aria-label="Select language"
      value={lang}
      onChange={(event) => setLang(event.target.value as typeof lang)}
      className="cursor-pointer rounded-full border border-gold-500/30 bg-white/5 px-3 py-1.5 text-sm font-medium text-gold-300 outline-none transition-colors hover:border-gold-500/60 focus:border-gold-500"
    >
      {LANGUAGES.map((language) => {
        const available = loading ? language.code === "en" || language.code === "am" : byCode.get(language.code)?.soloAvailable ?? false;
        return (
          <option key={language.code} value={language.code} disabled={!available} className="bg-navy-900 text-[#f3efe2]">
            {language.nativeName} ({language.englishName}){!available ? " — Coming Soon" : ""}
          </option>
        );
      })}
    </select>
  );
}
