"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getDailyVerse, getVerseText } from "@/lib/bible/verses";

export default function DailyVerseBanner() {
  const { lang } = useLanguage();
  const verse = useMemo(() => getDailyVerse(), []);
  const text = getVerseText(verse, lang);
  const isAmharic = lang === "am";

  return (
    <section className="mx-auto max-w-4xl px-5 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[28px] border border-purple-400/25 bg-gradient-to-br from-purple-500/15 via-white/[0.04] to-gold-500/10 p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,.35)] backdrop-blur-sm sm:p-9"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-purple-500/25 blur-3xl"
        />

        <div className="relative">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold-400">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse" />
            {isAmharic ? "የዕለቱ ጥቅስ" : "Verse of the Day"}
          </div>

          <p className="mx-auto mt-5 max-w-2xl font-display text-xl italic leading-relaxed text-[#f7f0dc] sm:text-2xl">
            &ldquo;{text}&rdquo;
          </p>

          <div className="mt-4 text-sm font-semibold text-purple-300">
            {verse.reference}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
