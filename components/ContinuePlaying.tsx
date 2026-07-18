"use client";

import { motion } from "framer-motion";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { CampaignProgress } from "@/lib/campaign";
import { MAX_GAME_LEVEL } from "@/lib/levels";
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

  const inProgress = CATEGORIES.map((category) => ({
    category,
    level: progress[category.id] ?? 1,
  })).filter((entry) => entry.level > 1);

  if (inProgress.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-5 pb-12">
      <h2 className="mb-5 font-display text-2xl font-bold text-[#fbf6e8]">
        {isAmharic ? "ጨዋታዎን ይቀጥሉ" : "Continue Playing"}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {inProgress.slice(0, 3).map(({ category, level }, i) => {
          const text = t.categories[category.id];
          const pct = Math.round(
            ((level - 1) / MAX_GAME_LEVEL) * 100
          );

          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              onClick={() => onContinue(category.id, level)}
              className="group rounded-[22px] border border-purple-400/25 bg-white/[0.04] p-5 text-left shadow-[0_16px_44px_rgba(0,0,0,.3)] transition-colors hover:border-purple-400/50"
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
    </section>
  );
}
