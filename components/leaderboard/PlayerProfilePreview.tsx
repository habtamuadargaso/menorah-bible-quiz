"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { countryCodeToFlagEmoji, type LeaderboardRow } from "@/lib/globalLeaderboard";

export default function PlayerProfilePreview({
  row,
  categoryTitle,
  onClose,
  labels,
}: {
  row: LeaderboardRow | null;
  categoryTitle: string | null;
  onClose: () => void;
  labels: {
    level: string;
    xp: string;
    columnWins: string;
    accuracy: string;
    previewBestStreak: string;
    previewFavoriteCategory: string;
    columnChurch: string;
    previewClose: string;
  };
}) {
  const reduceMotion = useReducedMotion();
  const flag = row ? countryCodeToFlagEmoji(row.countryCode) : null;

  return (
    <AnimatePresence>
      {row && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={row.displayName}
        >
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-[24px] border border-gold-500/25 bg-navy-900 p-7 shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="rounded-full border border-gold-500/40 bg-gold-500/15 px-3 py-1 text-xs font-bold text-gold-300">
                #{row.rank}
              </span>
              <button
                onClick={onClose}
                aria-label={labels.previewClose}
                className="text-xl leading-none text-[#8d94a3] outline-none hover:text-gold-500 focus-visible:ring-2 focus-visible:ring-gold-300 rounded-full"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold-500/50 bg-gold-500/10 font-display text-2xl font-bold text-gold-300">
                {row.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="mt-3 font-display text-xl font-bold text-[#fbf6e8]">{row.displayName}</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-[#9aa1b0]">
                {flag && <span aria-hidden>{flag}</span>}
                {row.churchName && <span>{row.churchName}</span>}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl border border-gold-500/20 bg-white/[0.04] px-2 py-3 text-center">
                <div className="font-display text-lg font-bold text-[#f3efe2]">{row.playerLevel}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-[#9aa1b0]">{labels.level}</div>
              </div>
              <div className="rounded-2xl border border-gold-500/20 bg-white/[0.04] px-2 py-3 text-center">
                <div className="font-display text-lg font-bold text-gold-300">{row.totalXp.toLocaleString()}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-[#9aa1b0]">{labels.xp}</div>
              </div>
              <div className="rounded-2xl border border-gold-500/20 bg-white/[0.04] px-2 py-3 text-center">
                <div className="font-display text-lg font-bold text-[#f3efe2]">{row.totalBattleWins}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-[#9aa1b0]">{labels.columnWins}</div>
              </div>
              <div className="rounded-2xl border border-gold-500/20 bg-white/[0.04] px-2 py-3 text-center">
                <div className="font-display text-lg font-bold text-[#f3efe2]">{row.accuracyPercent}%</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-[#9aa1b0]">{labels.accuracy}</div>
              </div>
              <div className="rounded-2xl border border-gold-500/20 bg-white/[0.04] px-2 py-3 text-center">
                <div className="font-display text-lg font-bold text-[#f3efe2]">{row.bestWinStreak}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-[#9aa1b0]">{labels.previewBestStreak}</div>
              </div>
              {categoryTitle && (
                <div className="rounded-2xl border border-gold-500/20 bg-white/[0.04] px-2 py-3 text-center">
                  <div className="truncate font-display text-xs font-bold text-[#f3efe2]">{categoryTitle}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wide text-[#9aa1b0]">{labels.previewFavoriteCategory}</div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
