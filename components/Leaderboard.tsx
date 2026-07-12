"use client";

import { motion } from "framer-motion";
import type { ScoreEntry } from "@/lib/leaderboard";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Leaderboard({ entries }: { entries: ScoreEntry[] }) {
  const { t } = useLanguage();
  const rows = [...entries].sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <section id="leaderboard" className="mx-auto max-w-lg px-5 pb-24 pt-4">
      <div className="mb-8 text-center">
        <h2 className="font-display text-3xl font-bold text-[#fbf6e8] sm:text-4xl">{t.leaderboard.heading}</h2>
        <p className="mt-2 text-sm text-[#a7aebd]">{t.leaderboard.subheading}</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-[#8d94a3]">
          {t.leaderboard.empty}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((row, i) => {
            const rank = i + 1;
            const isTop3 = rank <= 3;
            const badgeBg = rank === 1 ? "#e8c15f" : rank === 2 ? "rgba(212,175,55,0.4)" : rank === 3 ? "rgba(184,145,42,0.35)" : "rgba(255,255,255,0.08)";
            const badgeColor = isTop3 ? "#0b1f3a" : "#c6cbd6";
            return (
              <motion.div
                key={`${row.name}-${row.date}-${i}`}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className={`flex items-center gap-4 rounded-2xl border px-5 py-3.5 ${
                  isTop3 ? "border-gold-500/35 bg-gold-500/[0.06]" : "border-white/10 bg-white/[0.03]"
                }`}
                style={isTop3 ? { boxShadow: "0 0 24px rgba(212,175,55,0.12)" } : undefined}
              >
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ background: badgeBg, color: badgeColor }}
                >
                  {rank}
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-semibold text-[#f3efe2]">{row.name}</div>
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#8d94a3]">
                    <span>{row.categoryTitle}</span>
                    {row.difficulty && (
                      <>
                        <span aria-hidden>&middot;</span>
                        <span>{t.quiz.difficulty[row.difficulty]}</span>
                      </>
                    )}
                    {typeof row.xpEarned === "number" && (
                      <>
                        <span aria-hidden>&middot;</span>
                        <span className="text-gold-400">+{row.xpEarned} {t.common.xp}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="font-display text-lg font-bold text-gold-500">{row.score}</div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
