"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { CampaignProgress } from "@/lib/campaign";
import { MAX_GAME_LEVEL } from "@/lib/levels";
import { loadProgress, levelForXp } from "@/lib/progress";
import CategoryIcon from "./CategoryIcon";

export default function ContinuePlaying({
  progress,
  onContinue,
}: {
  progress: CampaignProgress;
  onContinue: (categoryId: CategoryId, level: number) => void;
}) {
  const { t, lang } = useLanguage();
  const isAmharic = lang === "am";

  const [playerLevel, setPlayerLevel] = useState(1);
  const [xpPct, setXpPct] = useState(0);
  const [xpIntoLevel, setXpIntoLevel] = useState(0);
  const [xpForNextLevel, setXpForNextLevel] = useState(500);

  useEffect(() => {
    const stats = levelForXp(loadProgress().totalXp);
    setPlayerLevel(stats.level);
    setXpPct(stats.progressPct);
    setXpIntoLevel(stats.xpIntoLevel);
    setXpForNextLevel(stats.xpForNextLevel);
  }, [progress]);

  const inProgress = CATEGORIES.map((category) => ({
    category,
    level: progress[category.id] ?? 1,
  }))
    .filter((entry) => entry.level > 1)
    .sort((a, b) => b.level - a.level);

  if (inProgress.length === 0) {
    return null;
  }

  const [featured, ...rest] = inProgress;
  const featuredText = t.categories[featured.category.id];
  const featuredPct = Math.round(((featured.level - 1) / MAX_GAME_LEVEL) * 100);

  return (
    <section className="mx-auto max-w-6xl px-5 pb-14">
      <h2 className="mb-5 font-display text-2xl font-bold text-[#fbf6e8]">
        {isAmharic ? "ጨዋታዎን ይቀጥሉ" : "Continue Playing"}
      </h2>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[32px] border border-purple-400/25 bg-gradient-to-br from-purple-500/15 via-white/[0.05] to-gold-500/10 p-7 shadow-[0_28px_80px_rgba(0,0,0,.36)] backdrop-blur-md sm:p-9"
      >
        {/* giant faint category artwork watermark */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 opacity-[0.07]"
        >
          <CategoryIcon icon={featured.category.icon} className="h-56 w-56" />
        </div>

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-purple-300/30 bg-gradient-to-br from-purple-400/25 to-gold-500/10 shadow-purple">
                <CategoryIcon icon={featured.category.icon} className="h-9 w-9" />
              </div>
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-navy-950 bg-gradient-to-br from-gold-400 to-gold-600 text-xs font-extrabold text-navy-950">
                {featured.level}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-purple-300">
                {isAmharic ? "ጉዞዎን ይቀጥሉ" : "Continue Your Journey"}
              </div>
              <h3 className="mt-1 font-display text-2xl font-bold text-[#fbf6e8] sm:text-3xl">
                {featuredText.title}
              </h3>
              <div className="mt-1 text-sm text-[#a7aebd]">
                {isAmharic
                  ? `ደረጃ ${featured.level} ከ ${MAX_GAME_LEVEL} · ተጫዋች ደረጃ ${playerLevel}`
                  : `Level ${featured.level} of ${MAX_GAME_LEVEL} · Player Level ${playerLevel}`}
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm lg:max-w-xs">
            <div className="flex items-center justify-between text-xs text-[#9aa1b0]">
              <span>{isAmharic ? "የካምፔይን እድገት" : "Campaign Progress"}</span>
              <span className="font-semibold text-gold-400">{featuredPct}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.max(6, featuredPct)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-purple-400 to-gold-500"
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-[#9aa1b0]">
              <span>{isAmharic ? "ወደ ቀጣይ ደረጃ ልምድ" : "XP to Next Level"}</span>
              <span className="font-semibold text-purple-300">
                {xpIntoLevel}/{xpForNextLevel}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.max(4, xpPct)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                className="h-full rounded-full bg-gradient-to-r from-purple-300 to-purple-500"
              />
            </div>

            <button
              onClick={() => onContinue(featured.category.id, featured.level)}
              className="mt-5 w-full rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-6 py-3 text-sm font-bold text-navy-950 shadow-gold transition-transform hover:-translate-y-0.5"
            >
              {isAmharic ? "ቀጥል →" : "Resume →"}
            </button>
          </div>
        </div>
      </motion.div>

      {rest.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.slice(0, 2).map(({ category, level }, i) => {
            const text = t.categories[category.id];
            const pct = Math.round(((level - 1) / MAX_GAME_LEVEL) * 100);
            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                onClick={() => onContinue(category.id, level)}
                className="group rounded-[22px] border border-white/10 bg-white/[0.04] p-5 text-left shadow-[0_16px_44px_rgba(0,0,0,.3)] transition-colors hover:border-purple-400/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/15">
                    <CategoryIcon icon={category.icon} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-base font-semibold text-[#f7f0dc]">
                      {text.title}
                    </div>
                    <div className="text-xs text-[#9aa1b0]">
                      {isAmharic
                        ? `ደረጃ ${level} ከ ${MAX_GAME_LEVEL}`
                        : `Level ${level} of ${MAX_GAME_LEVEL}`}
                    </div>
                  </div>
                </div>

                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-400 to-gold-500"
                    style={{ width: `${Math.max(6, pct)}%` }}
                  />
                </div>

                <div className="mt-3 text-xs font-semibold text-purple-300">
                  {isAmharic ? "ቀጥል →" : "Continue →"}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </section>
  );
}
