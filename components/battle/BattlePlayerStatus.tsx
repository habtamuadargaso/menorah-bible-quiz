"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type PlayerBattleStatus = "waiting" | "answered" | "correct" | "incorrect" | "disconnected";

const STATUS_STYLES: Record<PlayerBattleStatus, { border: string; bg: string; text: string; dot: string }> = {
  waiting: { border: "border-white/15", bg: "bg-white/[0.03]", text: "text-[#9aa1b0]", dot: "bg-[#9aa1b0]" },
  answered: { border: "border-purple-400/40", bg: "bg-purple-500/10", text: "text-purple-200", dot: "bg-purple-300" },
  correct: { border: "border-emerald-400/50", bg: "bg-emerald-500/15", text: "text-emerald-300", dot: "bg-emerald-400" },
  incorrect: { border: "border-red-400/50", bg: "bg-red-500/15", text: "text-red-300", dot: "bg-red-400" },
  disconnected: { border: "border-white/10", bg: "bg-white/[0.02]", text: "text-[#666d80]", dot: "bg-[#666d80]" },
};

// One small live-status chip for a single player (name initial + a
// colored, labeled status). Used in a horizontal strip during a round so
// everyone can see who has answered without revealing what they picked.
const BattlePlayerStatus = memo(function BattlePlayerStatus({
  name,
  status,
  label,
  isYou,
}: {
  name: string;
  status: PlayerBattleStatus;
  label: string;
  isYou: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const style = STATUS_STYLES[status];

  return (
    <motion.div
      layout={!reduceMotion}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.3 }}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${style.border} ${style.bg} ${style.text}`}
      role="status"
      aria-label={`${name}: ${label}`}
    >
      <span
        aria-hidden
        className={`h-5 w-5 flex-shrink-0 rounded-full text-center text-[10px] font-bold leading-5 ${style.dot} text-navy-950`}
      >
        {name.charAt(0).toUpperCase()}
      </span>
      <span className="max-w-[80px] truncate">
        {name}
        {isYou ? " ·" : ""}
      </span>
      {status === "answered" && !reduceMotion && (
        <motion.span
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
});

export default BattlePlayerStatus;
