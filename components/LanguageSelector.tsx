"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/i18n/locales";
import { useLanguageAvailability } from "@/lib/i18n/useLanguageAvailability";

// Mission 12: the "Solo Quiz" language selector (see LanguageModal.tsx's
// own copy). Every configured language in LANGUAGES is always selectable —
// this used to disable an option and label it "Coming Soon" based on
// soloAvailable, but the AI Question Factory + Global Translations already
// generate and publish real per-question content for every one of these
// languages, and a language should never be hidden just because it
// currently has fewer published questions than another (missing content is
// surfaced at gameplay time instead — see loadQuestionsForGame.ts). The
// availability fetch is only used for the small "published questions
// available" dot, never to gate the option itself.
export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();
  const { availability } = useLanguageAvailability();
  const byCode = new Map((availability ?? []).map((a) => [a.code, a]));

  return (
    <select
      aria-label="Select language"
      value={lang}
      onChange={(event) => setLang(event.target.value as typeof lang)}
      className="cursor-pointer rounded-full border border-gold-500/30 bg-white/5 px-3 py-1.5 text-sm font-medium text-gold-300 outline-none transition-colors hover:border-gold-500/60 focus:border-gold-500"
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
