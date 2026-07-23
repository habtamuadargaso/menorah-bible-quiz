"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function CurrentPlayerRankCard({
  globalRank,
  weeklyRank,
  totalXp,
  playerLevel,
  xpToNextRank,
  nextRankNumber,
  rankChange,
  labels,
}: {
  globalRank: number | null;
  weeklyRank: number | null;
  totalXp: number;
  playerLevel: number;
  xpToNextRank: number | null;
  nextRankNumber: number | null;
  rankChange: "up" | "down" | "same" | null;
  labels: {
    yourGlobalRank: string;
    yourWeeklyRank: string;
    level: string;
    xp: string;
    distanceToNextRank: string;
    alreadyTopRank: string;
    rankUp: string;
    rankDown: string;
    rankSame: string;
    notRankedYet: string;
  };
}) {
  const reduceMotion = useReducedMotion();

  if (globalRank === null) {
    return (
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
        className="sticky bottom-4 z-20 mx-auto max-w-md rounded-card border border-white/10 bg-navy-900/95 px-5 py-4 text-center text-sm text-[#a7aebd] shadow-premium-lg backdrop-blur-md"
      >
        {labels.notRankedYet}
      </motion.div>
    );
  }

  const changeIcon = rankChange === "up" ? "▲" : rankChange === "down" ? "▼" : rankChange === "same" ? "•" : null;
  const changeLabel = rankChange === "up" ? labels.rankUp : rankChange === "down" ? labels.rankDown : rankChange === "same" ? labels.rankSame : null;
  const changeColor = rankChange === "up" ? "text-emerald-400" : rankChange === "down" ? "text-red-400" : "text-[#9aa1b0]";

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
      className="sticky bottom-4 z-20 mx-auto max-w-lg rounded-card border border-gold-500/25 bg-glass-gold px-5 py-4 shadow-premium-lg backdrop-blur-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gold-400">{labels.yourGlobalRank}</span>
            <span className="font-display text-2xl font-bold text-[#fbf6e8]">#{globalRank}</span>
            {changeIcon && (
              <span className={`flex items-center gap-0.5 text-xs font-bold ${changeColor}`} aria-label={changeLabel ?? undefined}>
                {changeIcon}
              </span>
            )}
          </div>
          {weeklyRank !== null && (
            <div className="mt-0.5 text-xs text-[#9aa1b0]">
              {labels.yourWeeklyRank}: <span className="font-semibold text-purple-200">#{weeklyRank}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#9aa1b0]">{labels.level}</div>
            <div className="font-display text-sm font-bold text-[#f3efe2]">{playerLevel}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#9aa1b0]">{labels.xp}</div>
            <div className="font-display text-sm font-bold text-gold-300">{totalXp.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="mt-2.5 border-t border-white/10 pt-2.5 text-xs font-semibold text-[#c6cbd6]">
        {globalRank === 1 || xpToNextRank === null || nextRankNumber === null
          ? labels.alreadyTopRank
          : labels.distanceToNextRank.replace("{xp}", xpToNextRank.toLocaleString()).replace("{rank}", String(nextRankNumber))}
      </div>
    </motion.div>
  );
}
