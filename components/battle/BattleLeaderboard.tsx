"use client";

import { memo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export interface BattleLeaderboardEntry {
  id: string;
  name: string;
  score: number;
  isYou: boolean;
}

const MEDALS = ["🥇", "🥈", "🥉"];
const RANK_STYLES = [
  "border-gold-500/50 bg-glass-gold shadow-[0_0_20px_rgba(232,193,95,0.25)]",
  "border-white/25 bg-white/[0.06]",
  "border-[#b8912a]/40 bg-[#b8912a]/[0.08]",
];

// Animated, rank-ordered scoreboard — reused for the live in-round sidebar
// and (top 3 only) inside the final BattleSummary podium.
const BattleLeaderboard = memo(function BattleLeaderboard({
  heading,
  entries,
}: {
  heading: string;
  entries: BattleLeaderboardEntry[];
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{heading}</h2>
      <ul className="flex flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {entries.map((entry, index) => (
            <motion.li
              key={entry.id}
              layout={!reduceMotion}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
              transition={reduceMotion ? { duration: 0.15 } : { duration: 0.35, ease: "easeOut" }}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                index < 3 ? RANK_STYLES[index] : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="w-6 flex-shrink-0 text-center text-sm font-bold text-[#c6cbd6]" aria-hidden>
                  {index < 3 ? MEDALS[index] : index + 1}
                </span>
                <span className="truncate text-sm font-semibold text-[#f3efe2]">
                  {entry.name}
                  {entry.isYou && <span className="ml-1 text-xs font-normal text-[#8d94a3]">(you)</span>}
                </span>
              </div>
              <span className="flex-shrink-0 font-display text-sm font-bold text-gold-300">{entry.score}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
});

export default BattleLeaderboard;
