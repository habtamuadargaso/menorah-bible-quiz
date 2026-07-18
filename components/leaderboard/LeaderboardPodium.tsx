"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  countryCodeToFlagEmoji,
  formatMetricValue,
  metricValue,
  type LeaderboardMetric,
  type LeaderboardRow,
  type LeaderboardWindow,
} from "@/lib/globalLeaderboard";

const RANK_META = [
  { medal: "🥇", ring: "border-gold-500/60", glow: "shadow-[0_0_28px_rgba(232,193,95,0.4)]", height: "h-[168px] sm:h-[188px]", avatarSize: "h-16 w-16 sm:h-20 sm:w-20", order: "order-2" },
  { medal: "🥈", ring: "border-white/40", glow: "shadow-[0_0_18px_rgba(255,255,255,0.15)]", height: "h-[140px] sm:h-[156px]", avatarSize: "h-14 w-14 sm:h-16 sm:w-16", order: "order-1" },
  { medal: "🥉", ring: "border-[#b8912a]/60", glow: "shadow-[0_0_18px_rgba(184,145,42,0.3)]", height: "h-[120px] sm:h-[132px]", avatarSize: "h-12 w-12 sm:h-14 sm:w-14", order: "order-3" },
];

const PodiumCard = memo(function PodiumCard({
  row,
  rankIndex,
  metric,
  windowScope,
  onSelect,
}: {
  row: LeaderboardRow;
  rankIndex: number;
  metric: LeaderboardMetric;
  windowScope: LeaderboardWindow;
  onSelect: (row: LeaderboardRow) => void;
}) {
  const reduceMotion = useReducedMotion();
  const meta = RANK_META[rankIndex];
  const flag = countryCodeToFlagEmoji(row.countryCode);
  const value = formatMetricValue(metricValue(row, metric, windowScope), metric);

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.5, delay: rankIndex * 0.1, ease: "backOut" }}
      className={`flex flex-col items-center ${meta.order}`}
    >
      <button
        type="button"
        onClick={() => onSelect(row)}
        className="flex flex-col items-center outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 rounded-2xl px-2 py-1"
        aria-label={`${row.displayName}, rank ${row.rank}`}
      >
        <div className="relative">
          {rankIndex === 0 && (
            <motion.span
              aria-hidden
              className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl"
              animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
              transition={reduceMotion ? undefined : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              👑
            </motion.span>
          )}
          <div
            className={`flex items-center justify-center rounded-full border-2 bg-navy-900 font-display font-bold text-gold-300 ${meta.ring} ${meta.glow} ${meta.avatarSize}`}
          >
            {row.displayName.charAt(0).toUpperCase()}
          </div>
          <span className="absolute -bottom-1 -right-1 text-lg leading-none" aria-hidden>
            {meta.medal}
          </span>
        </div>

        <div className="mt-2 max-w-[88px] truncate text-sm font-bold text-[#f3efe2] sm:max-w-[140px]">{row.displayName}</div>
        <div className="flex max-w-[88px] items-center gap-1 text-xs text-[#9aa1b0] sm:max-w-none">
          {flag && <span aria-hidden>{flag}</span>}
          {row.churchName && <span className="truncate sm:max-w-[100px]">{row.churchName}</span>}
        </div>
        <div className="mt-1 font-display text-lg font-bold text-gold-400">{value}</div>
      </button>

      <div className={`mt-2 w-24 rounded-t-2xl border border-b-0 border-white/10 bg-white/[0.04] sm:w-28 ${meta.height}`} />
    </motion.div>
  );
});

export default function LeaderboardPodium({
  entries,
  metric,
  windowScope,
  heading,
  onSelectPlayer,
}: {
  entries: LeaderboardRow[];
  metric: LeaderboardMetric;
  windowScope: LeaderboardWindow;
  heading: string;
  onSelectPlayer: (row: LeaderboardRow) => void;
}) {
  if (entries.length === 0) return null;
  return (
    <div className="mx-auto max-w-3xl px-5">
      <h2 className="sr-only">{heading}</h2>
      <div className="flex items-end justify-center gap-1.5 sm:gap-6">
        {entries.slice(0, 3).map((row, i) => (
          <PodiumCard key={row.playerId} row={row} rankIndex={i} metric={metric} windowScope={windowScope} onSelect={onSelectPlayer} />
        ))}
      </div>
    </div>
  );
}
