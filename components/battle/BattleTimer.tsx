"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Circular countdown for the live battle round. Visual language matches
// QuizCard's CircularTimer (purple track, gold conic arc, pulses under
// 5s/3s) — reimplemented here since QuizCard.tsx is frozen.
const BattleTimer = memo(function BattleTimer({
  timeLeft,
  totalSeconds,
}: {
  timeLeft: number;
  totalSeconds: number;
}) {
  const reduceMotion = useReducedMotion();
  const urgent = timeLeft <= 3;
  const warning = timeLeft <= 5;
  const pct = Math.max(0, Math.min(100, Math.round((timeLeft / totalSeconds) * 100)));
  const color = urgent ? "#e0655f" : warning ? "#f0c868" : "#e8c15f";

  return (
    <motion.div
      className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full sm:h-20 sm:w-20"
      animate={
        reduceMotion
          ? undefined
          : urgent
            ? { scale: [1, 1.08, 1] }
            : warning
              ? { scale: [1, 1.04, 1] }
              : { scale: 1 }
      }
      transition={
        reduceMotion
          ? undefined
          : warning
            ? { duration: urgent ? 0.5 : 0.9, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.25 }
      }
      style={{ filter: reduceMotion ? undefined : `drop-shadow(0 0 14px ${color}55)` }}
      role="timer"
      aria-label={`${timeLeft} seconds remaining`}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: "conic-gradient(rgba(139,92,246,0.35) 100%, transparent 0)" }}
      />
      <div
        className="absolute inset-[3px] rounded-full transition-[background] duration-300"
        style={{ background: `conic-gradient(${color} ${pct}%, rgba(255,255,255,0.08) 0)` }}
      />
      <div
        className="absolute inset-[8px] flex items-center justify-center rounded-full bg-navy-950 text-xl font-extrabold shadow-[inset_0_0_14px_rgba(0,0,0,0.4)] sm:text-2xl"
        style={{ color }}
      >
        {timeLeft}
      </div>
    </motion.div>
  );
});

export default BattleTimer;
