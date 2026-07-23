"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  countryCodeToFlagEmoji,
  formatMetricValue,
  metricValue,
  type LeaderboardMetric,
  type LeaderboardRow as LeaderboardRowData,
  type LeaderboardWindow,
} from "@/lib/globalLeaderboard";

interface LeaderboardRowProps {
  row: LeaderboardRowData;
  metric: LeaderboardMetric;
  windowScope: LeaderboardWindow;
  isYou: boolean;
  youLabel: string;
  levelLabel: string;
  winsLabel: string;
  accuracyLabel: string;
  streakLabel: string;
  onSelect: (row: LeaderboardRowData) => void;
}

const rankTone = (rank: number) =>
  rank === 1 ? "text-gold-400" : rank === 2 ? "text-white" : rank === 3 ? "text-[#c99a2e]" : "text-[#9aa1b0]";

// Desktop table row. Rendered inside a real <table> so screen readers get
// correct row/cell semantics; layout+key animate a smooth rank-change.
export const LeaderboardTableRow = memo(function LeaderboardTableRow(props: LeaderboardRowProps) {
  const { row, isYou, youLabel, levelLabel, winsLabel, accuracyLabel, streakLabel, onSelect } = props;
  const reduceMotion = useReducedMotion();
  const flag = countryCodeToFlagEmoji(row.countryCode);

  return (
    <motion.tr
      layout={!reduceMotion}
      layoutId={`row-${row.playerId}`}
      transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
      onClick={() => onSelect(row)}
      tabIndex={0}
      role="button"
      aria-label={`${row.displayName}, ${levelLabel} ${row.playerLevel}, rank ${row.rank}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(row);
        }
      }}
      className={`cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-300 ${
        isYou ? "bg-gold-500/10" : "hover:bg-white/[0.03]"
      }`}
    >
      <td className={`px-4 py-3 text-sm font-bold ${rankTone(row.rank)}`}>#{row.rank}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-purple-400/40 bg-purple-500/15 text-xs font-bold text-purple-200">
            {row.displayName.charAt(0).toUpperCase()}
          </div>
          <span className="max-w-[140px] truncate text-sm font-semibold text-[#f3efe2]">{row.displayName}</span>
          {isYou && (
            <span className="rounded-full border border-gold-500/40 bg-gold-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-300">
              {youLabel}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center text-lg">{flag ?? "—"}</td>
      <td className="max-w-[140px] truncate px-4 py-3 text-sm text-[#a7aebd]">{row.churchName ?? "—"}</td>
      <td className="px-4 py-3 text-center text-sm text-[#c6cbd6]">{row.playerLevel}</td>
      <td className="px-4 py-3 text-right font-display text-sm font-bold text-gold-300">{row.totalXp.toLocaleString()}</td>
      <td className="px-4 py-3 text-center text-sm text-[#c6cbd6]" title={winsLabel}>
        {row.totalBattleWins}
      </td>
      <td className="px-4 py-3 text-center text-sm text-[#c6cbd6]" title={accuracyLabel}>
        {row.accuracyPercent}%
      </td>
      <td className="px-4 py-3 text-center text-sm text-[#c6cbd6]" title={streakLabel}>
        {row.currentWinStreak}
      </td>
    </motion.tr>
  );
});

// Mobile stacked card — same data, no table semantics, laid out to avoid
// any horizontal scrolling.
export const LeaderboardMobileCard = memo(function LeaderboardMobileCard(props: LeaderboardRowProps) {
  const { row, metric, windowScope, isYou, youLabel, levelLabel, winsLabel, accuracyLabel, streakLabel, onSelect } = props;
  const reduceMotion = useReducedMotion();
  const flag = countryCodeToFlagEmoji(row.countryCode);
  const value = formatMetricValue(metricValue(row, metric, windowScope), metric);

  return (
    <motion.button
      type="button"
      layout={!reduceMotion}
      layoutId={`card-${row.playerId}`}
      transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
      onClick={() => onSelect(row)}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${
        isYou ? "border-gold-500/40 bg-gold-500/10" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <span className={`w-8 flex-shrink-0 text-center text-sm font-bold ${rankTone(row.rank)}`}>#{row.rank}</span>
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-purple-400/40 bg-purple-500/15 text-xs font-bold text-purple-200">
        {row.displayName.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-[#f3efe2]">{row.displayName}</span>
          {isYou && (
            <span className="flex-shrink-0 rounded-full border border-gold-500/40 bg-gold-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-gold-300">
              {youLabel}
            </span>
          )}
        </span>
        <span className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-[#8d94a3]">
          {flag && <span aria-hidden>{flag}</span>}
          <span>
            {levelLabel} {row.playerLevel}
          </span>
          <span aria-hidden>&middot;</span>
          <span title={winsLabel}>🏆{row.totalBattleWins}</span>
          <span aria-hidden>&middot;</span>
          <span title={accuracyLabel}>🎯{row.accuracyPercent}%</span>
          <span aria-hidden>&middot;</span>
          <span title={streakLabel}>🔥{row.currentWinStreak}</span>
        </span>
      </span>
      <span className="flex-shrink-0 font-display text-sm font-bold text-gold-300">
        {metric === "total_xp" ? row.totalXp.toLocaleString() : value}
      </span>
    </motion.button>
  );
});
