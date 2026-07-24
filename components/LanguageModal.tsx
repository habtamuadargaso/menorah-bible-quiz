"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/i18n/locales";
import { useLanguageAvailability } from "@/lib/i18n/useLanguageAvailability";

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
  const { availability, loading } = useLanguageAvailability();
  const byCode = new Map((availability ?? []).map((a) => [a.code, a]));

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
          className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden bg-navy-950/70 px-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:pt-4"
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
            className="flex w-full max-w-md flex-col overflow-hidden rounded-card border border-gold-500/20 bg-glass-gold shadow-premium"
            style={{
              maxHeight:
                "calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 24px)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex-shrink-0 px-6 pt-6 sm:px-8 sm:pt-8">
              <h2
                id="language-modal-heading"
                className="font-display text-2xl font-bold text-[#fbf6e8]"
              >
                Choose Your Language
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#a7aebd]">
                Select the language you want to play Solo Quiz in. You can change this later from the header.
              </p>
            </div>

            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4 pt-5 sm:px-8"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {LANGUAGES.map((language) => {
                  const selected = language.code === lang;
                  // Every configured language is always selectable — a
                  // language is never hidden or disabled just because it has
                  // fewer published questions than another. Missing content
                  // is surfaced later, at gameplay time, as an explicit
                  // unavailable-content message (CLAUDE.md rule 5), never by
                  // blocking the choice up front.
                  const hasLiveContent = !loading && (byCode.get(language.code)?.publishedCount ?? 0) > 0;
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
                      <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide opacity-70">
                        {language.englishName}
                        {hasLiveContent && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Published questions available" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="sticky bottom-0 flex flex-shrink-0 flex-col-reverse gap-3 border-t border-white/10 bg-navy-950/95 px-6 pt-4 backdrop-blur-md sm:flex-row sm:justify-end sm:px-8"
              style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
            >
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-6 py-2.5 text-sm font-bold text-navy-950 shadow-gold outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 sm:w-auto"
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
