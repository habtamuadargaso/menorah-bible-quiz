"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

// One row in the lobby's player list. Wrap the list itself in
// <AnimatePresence> at the call site so join/leave animate via this
// component's initial/exit props.
const PlayerCard = memo(function PlayerCard({
  name,
  isHost,
  isReady,
  isYou,
  hostLabel,
  readyLabel,
  waitingLabel,
}: {
  name: string;
  isHost: boolean;
  isReady: boolean;
  isYou: boolean;
  hostLabel: string;
  readyLabel: string;
  waitingLabel: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.li
      layout={!reduceMotion}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -16, scale: 0.96 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 16, scale: 0.96 }}
      transition={reduceMotion ? { duration: 0.2 } : { duration: 0.35, ease: "easeOut" }}
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 shadow-[0_4px_18px_rgba(0,0,0,0.22)] ${
        isHost ? "border-gold-500/40 bg-glass-gold" : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border font-display text-base font-bold ${
            isHost ? "border-gold-500/60 bg-gold-500/15 text-gold-300" : "border-purple-400/40 bg-purple-500/15 text-purple-200"
          }`}
          aria-hidden
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 truncate text-sm font-semibold text-[#f3efe2]">
            <span className="truncate">{name}</span>
            {isYou && <span className="text-xs font-normal text-[#8d94a3]">(you)</span>}
          </div>
          {isHost && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-gold-400">
              👑 {hostLabel}
            </span>
          )}
        </div>
      </div>

      <span
        className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
          isReady
            ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
            : "border-white/15 bg-white/[0.03] text-[#9aa1b0]"
        }`}
      >
        {isReady ? `✓ ${readyLabel}` : waitingLabel}
      </span>
    </motion.li>
  );
});

export default PlayerCard;
