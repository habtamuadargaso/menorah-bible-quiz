"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getDailyVerse, getMemoryVerse, getVerseText } from "@/lib/bible/verses";
import ComingSoonCard from "./ComingSoonCard";
import SectionBackdrop from "./SectionBackdrop";

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

function FeatureIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d={path}
        stroke="#e8c15f"
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

const READING_PLAN_ICON = "M4 5.5c2-1 5-1 8 0 3-1 6-1 8 0v13c-2-1-5-1-8 0-3-1-6-1-8 0Zm4 3h4M8 12h4M8 15.5h3";
const FAVORITES_ICON = "M12 20s-7-4.3-9.3-8.6C1.2 8.3 3 5 6.4 5c1.9 0 3.3 1 4 2.3.7-1.3 2.1-2.3 4-2.3 3.4 0 5.2 3.3 3.7 6.4C19 15.7 12 20 12 20Z";
const PRAYER_JOURNAL_ICON = "M12 4v9M8 21c0-4 1.8-6.5 4-8 2.2 1.5 4 4 4 8M5 21h14";

export default function BibleLearningSection() {
  const { t, lang } = useLanguage();
  const dailyVerse = useMemo(() => getDailyVerse(), []);
  const memoryVerse = useMemo(() => getMemoryVerse(), []);
  const [revealed, setRevealed] = useState(false);

  const dailyText = getVerseText(dailyVerse, lang);
  const memoryText = getVerseText(memoryVerse, lang);

  return (
    <section id="bible-learning" className="relative mx-auto max-w-5xl px-5 pb-20 pt-10">
      <SectionBackdrop tint="gold" />
      <div className="mb-10 text-center">
        <h2 className="font-display text-3xl font-bold text-[#fbf6e8] sm:text-4xl">{t.bible.heading}</h2>
        <p className="mt-2 text-[15px] text-[#a7aebd]">{t.bible.subheading}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Daily Bible Verse — functional */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4 }}
          whileHover={{ y: -6, scale: 1.02 }}
          className="rounded-card-sm border border-gold-500/25 bg-glass-gold p-6 shadow-premium transition-colors hover:border-gold-500/45"
        >
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "radial-gradient(circle, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.03) 100%)" }}
          >
            <FeatureIcon path="M4 5.5c2-1 5-1 8 0 3-1 6-1 8 0v13c-2-1-5-1-8 0-3-1-6-1-8 0Z" />
          </div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gold-500">
            {t.bible.dailyVerse.title}
          </div>
          <p className="font-display text-xl italic leading-relaxed text-[#f3efe2]">&ldquo;{dailyText}&rdquo;</p>
          <div className="mt-4 text-sm font-semibold text-gold-400">{dailyVerse.reference}</div>
        </motion.div>

        {/* Memory Verse Challenge — functional reveal/hide */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: 0.05 }}
          whileHover={{ y: -6, scale: 1.02 }}
          className="rounded-card-sm border border-gold-500/25 bg-glass-gold p-6 shadow-premium transition-colors hover:border-gold-500/45"
        >
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "radial-gradient(circle, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.03) 100%)" }}
          >
            <FeatureIcon path="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-1 .5-1.5 1-1.5 2.2M12 17.5h.01" />
          </div>
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
            className="mt-4 rounded-full border border-gold-500/50 px-5 py-2 text-sm font-semibold text-gold-500 outline-none transition-colors hover:bg-gold-500/10 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {revealed ? t.bible.memoryVerse.hideAgain : t.bible.memoryVerse.reveal}
          </button>
        </motion.div>

        <ComingSoonCard
          title={t.bible.readingPlan.title}
          subtitle={t.bible.readingPlan.subtitle}
          icon={<FeatureIcon path={READING_PLAN_ICON} />}
        />
        <ComingSoonCard
          title={t.bible.favorites.title}
          subtitle={t.bible.favorites.subtitle}
          icon={<FeatureIcon path={FAVORITES_ICON} />}
        />
        <ComingSoonCard
          title={t.bible.prayerJournal.title}
          subtitle={t.bible.prayerJournal.subtitle}
          icon={<FeatureIcon path={PRAYER_JOURNAL_ICON} />}
        />
      </div>
    </section>
  );
}
