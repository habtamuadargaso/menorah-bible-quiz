"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Globe, Check, ChevronRight, Wheat } from "lucide-react";
import { LANGUAGES } from "@/lib/i18n/locales";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { hapticLight } from "@/lib/mobile/haptics";

// Mission 21.1 — redrawn as a full-width vertical list (matching the
// approved mockup) instead of the previous 2-column grid. Selecting a
// language still calls the same setLang() every other picker in the app
// uses (LanguageContext), so it updates the whole app immediately.
export default function OnboardingLanguageScreen({
  heading,
  headingAccent,
  subheading,
}: {
  heading: string;
  headingAccent: string;
  subheading: string;
}) {
  const reduceMotion = useReducedMotion();
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex h-full flex-col px-5 pb-4">
      <div className="flex flex-col items-center pb-2 pt-1 text-center">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2"
        >
          <Wheat className="h-6 w-6 -scale-x-100 text-gold-500/60" aria-hidden />
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-gold-400/40 bg-gold-500/15 shadow-gold">
            <Globe className="h-7 w-7 text-gold-300" aria-hidden />
          </span>
          <Wheat className="h-6 w-6 text-gold-500/60" aria-hidden />
        </motion.div>
        <h1 className="mt-3 font-display text-xl font-bold leading-tight text-[#fbf6e8]">
          {heading}
          <br />
          <span className="text-gold-500">{headingAccent}</span>
        </h1>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-[#c6cbd6]">{subheading}</p>
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        {LANGUAGES.map((language, i) => {
          const selected = language.code === lang;
          return (
            <motion.button
              key={language.code}
              type="button"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.2, delay: reduceMotion ? 0 : i * 0.015 } }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              onClick={() => {
                hapticLight();
                setLang(language.code);
              }}
              aria-pressed={selected}
              className={`flex min-h-[48px] items-center gap-2.5 rounded-card-sm border px-3.5 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${
                selected
                  ? "border-gold-400/60 bg-gold-500/15 shadow-gold"
                  : "border-white/10 bg-white/[0.04] hover:border-gold-500/30"
              }`}
            >
              <span className="text-lg" aria-hidden>
                {language.flag}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#f7f0dc]">{language.nativeName}</span>
                <span className="block truncate text-[11px] text-[#9aa1b0]">{language.englishName}</span>
              </span>
              {selected ? (
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gold-400 text-navy-900">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#6b7280]" aria-hidden />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
