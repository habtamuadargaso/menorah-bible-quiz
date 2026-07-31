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
      transition={{ duration: 0.28, delay: 0.03 }}
      className="relative mx-3 mt-3 overflow-hidden rounded-[26px] border border-gold-500/20 bg-gradient-to-br from-white/[0.055] via-navy-900/70 to-navy-950/70 px-5 py-5 shadow-premium"
    >
      <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold-500/10 blur-2xl" />
      <div className="relative flex items-center gap-2">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-gold-500/25 bg-gold-500/10 text-gold-300">
          <BookOpen className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-400">
          {isAmharic ? "የዕለቱ ጥቅስ" : "Today's Verse"}
        </span>
      </div>
      <div className="my-3 h-px bg-gradient-to-r from-gold-500/45 via-gold-500/15 to-transparent" />
      <p className="font-display text-base italic leading-7 text-[#f7f0dc]">
        &ldquo;{text}&rdquo;
      </p>
      <div className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-gold-400">{verse.reference}</div>
    </motion.div>
  );
}
