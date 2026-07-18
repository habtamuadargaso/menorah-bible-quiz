"use client";

import { motion } from "framer-motion";
import type { ScoreEntry } from "@/lib/leaderboard";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LeaderboardPreview({
  entries,
  onViewAll,
}: {
  entries: ScoreEntry[];
  onViewAll: () => void;
}) {
  const { t, lang } = useLanguage();
  const isAmharic = lang === "am";
  const rows = [...entries].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <section className="mx-auto max-w-3xl px-5 pb-12">
      <div className="rounded-[28px] border border-gold-500/25 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,.3)] sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-[#fbf6e8]">
            {t.leaderboard.heading}
          </h2>
          <button
            onClick={onViewAll}
            className="shrink-0 text-sm font-semibold text-gold-400 transition-colors hover:text-gold-300"
          >
            {isAmharic ? "ሁሉንም ይመልከቱ →" : "View All →"}
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-[#8d94a3]">
            {t.leaderboard.empty}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((row, i) => {
              const rank = i + 1;
              const isTop3 = rank <= 3;
              const badgeBg =
                rank === 1
                  ? "#e8c15f"
                  : rank === 2
                  ? "rgba(212,175,55,0.4)"
                  : rank === 3
                  ? "rgba(184,145,42,0.35)"
                  : "rgba(255,255,255,0.08)";
              const badgeColor = isTop3 ? "#0b1f3a" : "#c6cbd6";

              return (
                <motion.div
                  key={`${row.name}-${row.date}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                    isTop3
                      ? "border-gold-500/30 bg-gold-500/[0.05]"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{ background: badgeBg, color: badgeColor }}
                  >
                    {rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[#f3efe2]">
                      {row.name}
                    </div>
                    <div className="truncate text-xs text-[#8d94a3]">
                      {row.categoryTitle}
                    </div>
                  </div>
                  <div className="font-display text-base font-bold text-gold-500">
                    {row.score}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
