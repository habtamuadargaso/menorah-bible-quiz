"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getDailyVerse, getVerseText } from "@/lib/bible/verses";

// Mission 15.5 — compact "Today's Verse" card for the mobile home
// dashboard, reusing the same lib/bible/verses.ts data as the desktop
// DailyVerseBanner/BibleLearningSection (no new verse content, no backend
// calls). Strengthens the app's Bible identity above the fold without the
// full-size desktop banner treatment.
export default function MobileVerseCard() {
  const { lang } = useLanguage();
  const isAmharic = lang === "am";
  const reduceMotion = useReducedMotion();
  const verse = useMemo(() => getDailyVerse(), []);
  const text = getVerseText(verse, lang);

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="relative mx-4 mt-3 overflow-hidden rounded-card-sm border border-purple-400/25 bg-gradient-to-br from-purple-500/15 via-navy-900/60 to-navy-950/50 p-4 shadow-premium"
    >
      <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-purple-500/15 blur-2xl" />
      <div className="relative flex items-center gap-2">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-purple-300">
          <BookOpen className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-purple-300">
          {isAmharic ? "የዕለቱ ጥቅስ" : "Today's Verse"}
        </span>
      </div>
      <p className="mt-2 font-display text-[15px] italic leading-relaxed text-[#f7f0dc]">
        &ldquo;{text}&rdquo;
      </p>
      <div className="mt-2 text-xs font-semibold text-purple-300">{verse.reference}</div>
    </motion.div>
  );
}
