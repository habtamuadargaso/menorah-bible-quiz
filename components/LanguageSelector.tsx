"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { FULLY_TRANSLATED_QUESTION_LANGS, LANGUAGES } from "@/lib/i18n/locales";

const PLAYABLE_LANGUAGES = LANGUAGES.filter((language) =>
  FULLY_TRANSLATED_QUESTION_LANGS.includes(language.code)
);

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();

  return (
    <select
      aria-label="Select language"
      value={lang}
      onChange={(event) => setLang(event.target.value as typeof lang)}
      className="cursor-pointer rounded-full border border-gold-500/30 bg-white/5 px-3 py-1.5 text-sm font-medium text-gold-300 outline-none transition-colors hover:border-gold-500/60 focus:border-gold-500"
    >
      {PLAYABLE_LANGUAGES.map((language) => (
        <option
          key={language.code}
          value={language.code}
          className="bg-navy-900 text-[#f3efe2]"
        >
          {language.nativeName} ({language.englishName})
        </option>
      ))}
    </select>
  );
}
