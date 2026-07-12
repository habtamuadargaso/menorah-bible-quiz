"use client";

import { motion } from "framer-motion";
import type { CategoryId } from "@/lib/categories";
import { getHighestUnlockedLevel, type CampaignProgress } from "@/lib/campaign";
import { MAX_GAME_LEVEL } from "@/lib/levels";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function CampaignMap({
  categoryId,
  activeLevel,
  progress,
  onSelectLevel,
}: {
  categoryId: CategoryId;
  activeLevel: number;
  progress: CampaignProgress;
  onSelectLevel: (level: number) => void;
}) {
  const { t } = useLanguage();
  const highestUnlocked = getHighestUnlockedLevel(categoryId, progress);

  return (
    <section className="mx-auto max-w-5xl px-5 pb-8 pt-6">
      <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-gold-400">{t.campaign.journey}</div>
          <h2 className="mt-1 font-display text-2xl font-bold text-[#fbf6e8]">
            {t.categories[categoryId]?.title} · {t.common.level} {activeLevel}/{MAX_GAME_LEVEL}
          </h2>
        </div>
        <div className="text-sm text-[#a7aebd]">{t.campaign.passInstruction}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-10">
        {Array.from({ length: MAX_GAME_LEVEL }).map((_, i) => {
          const level = i + 1;
          const locked = level > highestUnlocked;
          const completed = level < highestUnlocked;
          const current = level === activeLevel;
          return (
            <motion.button
              key={level}
              whileHover={!locked ? { y: -3, scale: 1.02 } : undefined}
              whileTap={!locked ? { scale: 0.98 } : undefined}
              disabled={locked}
              onClick={() => onSelectLevel(level)}
              className={`rounded-2xl border px-3 py-4 text-center transition ${
                current
                  ? "border-gold-400 bg-gold-500/20 shadow-gold"
                  : completed
                    ? "border-emerald-400/40 bg-emerald-400/10"
                    : locked
                      ? "border-white/10 bg-white/[0.025] opacity-55"
                      : "border-gold-500/25 bg-white/[0.04] hover:border-gold-500/55"
              }`}
              aria-label={`Level ${level} ${locked ? "locked" : completed ? "completed" : "unlocked"}`}
            >
              <div className="text-lg">{locked ? "🔒" : completed ? "✓" : current ? "⭐" : "✦"}</div>
              <div className="mt-1 font-display text-lg font-bold text-[#fbf6e8]">{level}</div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9aa1b0]">{level <= 3 ? t.campaign.foundation : level <= 7 ? t.campaign.growingDisciple : t.campaign.scriptureMaster}</div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
