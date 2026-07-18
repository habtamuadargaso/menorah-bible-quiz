"use client";

import { AnimatePresence } from "framer-motion";
import type { LeaderboardMetric, LeaderboardRow as LeaderboardRowData, LeaderboardWindow } from "@/lib/globalLeaderboard";
import { LeaderboardMobileCard, LeaderboardTableRow } from "./LeaderboardRow";

export default function LeaderboardTable({
  rows,
  metric,
  windowScope,
  currentPlayerId,
  totalCount,
  onLoadMore,
  isLoadingMore,
  onSelectPlayer,
  labels,
}: {
  rows: LeaderboardRowData[];
  metric: LeaderboardMetric;
  windowScope: LeaderboardWindow;
  currentPlayerId: string | null;
  totalCount: number;
  onLoadMore: () => void;
  isLoadingMore: boolean;
  onSelectPlayer: (row: LeaderboardRowData) => void;
  labels: {
    columnRank: string;
    columnPlayer: string;
    columnCountry: string;
    columnChurch: string;
    columnLevel: string;
    xp: string;
    columnWins: string;
    accuracy: string;
    columnStreak: string;
    youBadge: string;
    loadMore: string;
    showingCount: string;
  };
}) {
  const sharedRowProps = (row: LeaderboardRowData) => ({
    row,
    metric,
    windowScope,
    isYou: row.playerId === currentPlayerId,
    youLabel: labels.youBadge,
    levelLabel: labels.columnLevel,
    winsLabel: labels.columnWins,
    accuracyLabel: labels.accuracy,
    streakLabel: labels.columnStreak,
    onSelect: onSelectPlayer,
  });

  return (
    <div className="mx-auto max-w-5xl px-5">
      {/* Desktop / tablet: real table with a sticky header */}
      <div className="hidden overflow-hidden rounded-card border border-white/10 bg-white/[0.03] shadow-premium sm:block">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Global player rankings</caption>
            <thead className="sticky top-0 z-10 bg-navy-900/95 backdrop-blur-sm">
              <tr className="text-[11px] font-bold uppercase tracking-wide text-[#9aa1b0]">
                <th scope="col" className="px-4 py-3">{labels.columnRank}</th>
                <th scope="col" className="px-4 py-3">{labels.columnPlayer}</th>
                <th scope="col" className="px-4 py-3 text-center">{labels.columnCountry}</th>
                <th scope="col" className="px-4 py-3">{labels.columnChurch}</th>
                <th scope="col" className="px-4 py-3 text-center">{labels.columnLevel}</th>
                <th scope="col" className="px-4 py-3 text-right">{labels.xp}</th>
                <th scope="col" className="px-4 py-3 text-center">{labels.columnWins}</th>
                <th scope="col" className="px-4 py-3 text-center">{labels.accuracy}</th>
                <th scope="col" className="px-4 py-3 text-center">{labels.columnStreak}</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {rows.map((row) => (
                  <LeaderboardTableRow key={row.playerId} {...sharedRowProps(row)} />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: stacked cards, no horizontal scrolling */}
      <div className="flex flex-col gap-2.5 sm:hidden">
        <AnimatePresence initial={false}>
          {rows.map((row) => (
            <LeaderboardMobileCard key={row.playerId} {...sharedRowProps(row)} />
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-5 flex flex-col items-center gap-3">
        <p className="text-xs text-[#8d94a3]">
          {labels.showingCount.replace("{shown}", String(rows.length)).replace("{total}", String(totalCount))}
        </p>
        {rows.length < totalCount && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="rounded-full border border-gold-500/45 px-6 py-2.5 text-sm font-bold text-gold-300 outline-none transition-colors hover:bg-gold-500/10 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingMore ? "…" : labels.loadMore}
          </button>
        )}
      </div>
    </div>
  );
}
