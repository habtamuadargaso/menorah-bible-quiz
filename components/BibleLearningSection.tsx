"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getDailyVerse, getMemoryVerse, getVerseText } from "@/lib/bible/verses";
import ComingSoonCard from "./ComingSoonCard";

function maskVerse(text: string) {
  // Blanks out every other word (keeps short words/punctuation-only tokens visible)
  return text
    .split(" ")
    .map((word, i) => {
      const clean = word.replace(/[.,;:!]/g, "");
      if (clean.length > 3 && i % 2 === 1) {
        return "▁".repeat(Math.min(clean.length, 6));
      }
      return word;
    })
    .join(" ");
}

export default function BibleLearningSection() {
  const { t, lang } = useLanguage();
  const dailyVerse = useMemo(() => getDailyVerse(), []);
  const memoryVerse = useMemo(() => getMemoryVerse(), []);
  const [revealed, setRevealed] = useState(false);

  const dailyText = getVerseText(dailyVerse, lang);
  const memoryText = getVerseText(memoryVerse, lang);

  return (
    <section id="bible-learning" className="mx-auto max-w-5xl px-5 pb-20 pt-8">
      <div className="mb-10 text-center">
        <h2 className="font-display text-3xl font-bold text-[#fbf6e8] sm:text-4xl">{t.bible.heading}</h2>
        <p className="mt-2 text-[15px] text-[#a7aebd]">{t.bible.subheading}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Daily Bible Verse — functional */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="rounded-[20px] border border-gold-500/25 bg-white/[0.04] p-6"
        >
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gold-500">
            {t.bible.dailyVerse.title}
          </div>
          <p className="font-display text-xl italic leading-relaxed text-[#f3efe2]">&ldquo;{dailyText}&rdquo;</p>
          <div className="mt-4 text-sm font-semibold text-gold-400">{dailyVerse.reference}</div>
        </motion.div>

        {/* Memory Verse Challenge — functional reveal/hide */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-[20px] border border-gold-500/25 bg-white/[0.04] p-6"
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gold-500">
            {t.bible.memoryVerse.title}
          </div>
          <p className="mb-3 text-sm text-[#9aa1b0]">{t.bible.memoryVerse.subtitle}</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={revealed ? "revealed" : "hidden"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-display text-lg leading-relaxed text-[#f3efe2]"
            >
              &ldquo;{revealed ? memoryText : maskVerse(memoryText)}&rdquo;
            </motion.p>
          </AnimatePresence>
          <div className="mt-3 text-sm font-semibold text-gold-400">{memoryVerse.reference}</div>
          <button
            onClick={() => setRevealed((r) => !r)}
            className="mt-4 rounded-full border border-gold-500/50 px-5 py-2 text-sm font-semibold text-gold-500 transition-colors hover:bg-gold-500/10"
          >
            {revealed ? t.bible.memoryVerse.hideAgain : t.bible.memoryVerse.reveal}
          </button>
        </motion.div>

        <ComingSoonCard title={t.bible.readingPlan.title} subtitle={t.bible.readingPlan.subtitle} />
        <ComingSoonCard title={t.bible.favorites.title} subtitle={t.bible.favorites.subtitle} />
        <ComingSoonCard title={t.bible.prayerJournal.title} subtitle={t.bible.prayerJournal.subtitle} />
      </div>
    </section>
  );
}
