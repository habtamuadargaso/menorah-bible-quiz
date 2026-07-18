"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import BattleTimer from "./BattleTimer";

const BattleHeader = memo(function BattleHeader({
  roomCode,
  roomLabel,
  questionProgressText,
  remainingPlayersLabel,
  remainingPlayersCount,
  categoryTitle,
  difficultyLabel,
  timeLeft,
  totalSeconds,
}: {
  roomCode: string;
  roomLabel: string;
  questionProgressText: string;
  remainingPlayersLabel: string;
  remainingPlayersCount: number;
  categoryTitle: string;
  difficultyLabel: string;
  timeLeft: number;
  totalSeconds: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.header
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
      className="flex flex-col gap-4 rounded-card border border-gold-500/20 bg-glass-gold p-5 shadow-premium-lg backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-500">
          {roomLabel} {roomCode}
        </p>
        <h1 className="mt-1 font-display text-xl font-bold text-[#fbf6e8] sm:text-2xl">{questionProgressText}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#a7aebd]">
          <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-2.5 py-0.5 font-semibold text-purple-200">
            {categoryTitle}
          </span>
          <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-0.5 font-semibold text-gold-300">
            {difficultyLabel}
          </span>
          <span>
            👥 {remainingPlayersCount} {remainingPlayersLabel}
          </span>
        </div>
      </div>

      <BattleTimer timeLeft={timeLeft} totalSeconds={totalSeconds} />
    </motion.header>
  );
});

export default BattleHeader;
