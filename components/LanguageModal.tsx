"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { FULLY_TRANSLATED_QUESTION_LANGS, LANGUAGES } from "@/lib/i18n/locales";

const PLAYABLE_LANGUAGES = LANGUAGES.filter((language) =>
  FULLY_TRANSLATED_QUESTION_LANGS.includes(language.code)
);

export default function LanguageModal({
  open,
  onClose,
  onContinue,
}: {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
}) {
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 px-4 backdrop-blur-sm"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="language-modal-heading"
            className="w-full max-w-md rounded-card border border-gold-500/20 bg-glass-gold p-6 shadow-premium sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="language-modal-heading"
              className="font-display text-2xl font-bold text-[#fbf6e8]"
            >
              Choose Your Language
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#a7aebd]">
              Select the language you want to play Solo Quiz in. You can change this later from the header.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {PLAYABLE_LANGUAGES.map((language) => {
                const selected = language.code === lang;
                return (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => setLang(language.code)}
                    aria-pressed={selected}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${
                      selected
                        ? "border-gold-500/60 bg-gold-500/15 text-gold-200"
                        : "border-white/10 bg-white/5 text-[#c6cbd6] hover:border-gold-500/30 hover:bg-white/10"
                    }`}
                  >
                    <span className="font-semibold">{language.nativeName}</span>
                    <span className="text-xs uppercase tracking-wide opacity-70">
                      {language.englishName}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-[#c6cbd6] outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onContinue}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-6 py-2.5 text-sm font-bold text-navy-950 shadow-gold outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
              >
                Continue
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
