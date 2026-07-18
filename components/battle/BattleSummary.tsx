"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import BattleLeaderboard, { type BattleLeaderboardEntry } from "./BattleLeaderboard";

const StatTile = memo(function StatTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-4 text-center shadow-[0_4px_18px_rgba(0,0,0,0.22)]">
      <div className="text-lg" aria-hidden>
        {icon}
      </div>
      <div className="mt-1 font-display text-xl font-bold text-gold-400">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-[#9aa1b0]">{label}</div>
    </div>
  );
});

export default function BattleSummary({
  entries,
  championLabel,
  topThreeHeading,
  playersHeading,
  xpEarned,
  coinsEarned,
  accuracyPct,
  reactionSeconds,
  xpLabel,
  coinsLabel,
  accuracyLabel,
  reactionLabel,
  secondsShort,
  leaveLabel,
  onLeave,
}: {
  entries: BattleLeaderboardEntry[];
  championLabel: string;
  topThreeHeading: string;
  playersHeading: string;
  xpEarned: number;
  coinsEarned: number;
  accuracyPct: number;
  reactionSeconds: number;
  xpLabel: string;
  coinsLabel: string;
  accuracyLabel: string;
  reactionLabel: string;
  secondsShort: string;
  leaveLabel: string;
  onLeave: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const winner = entries[0];
  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <section className="relative mx-auto max-w-2xl overflow-hidden px-5 pb-16 pt-8 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl"
          animate={reduceMotion ? undefined : { opacity: [0.5, 0.9, 0.5], scale: [1, 1.08, 1] }}
          transition={reduceMotion ? undefined : { duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-20 top-56 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl"
          animate={reduceMotion ? undefined : { opacity: [0.4, 0.8, 0.4], scale: [1.05, 0.95, 1.05] }}
          transition={reduceMotion ? undefined : { duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />
      </div>

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.9 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduceMotion ? 0.2 : 0.55, ease: "backOut" }}
        className="mx-auto flex h-[140px] w-[140px] items-center justify-center rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(232,193,95,0.35), rgba(232,193,95,0.02))",
          boxShadow: "0 0 46px rgba(232,193,95,0.4)",
        }}
      >
        <motion.div
          animate={reduceMotion ? undefined : { scale: [1, 1.05, 1] }}
          transition={reduceMotion ? undefined : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-[112px] w-[112px] flex-col items-center justify-center rounded-full border border-gold-500/50 bg-navy-900"
        >
          <span className="text-4xl drop-shadow-[0_0_18px_rgba(232,193,95,0.6)]" aria-hidden>
            🏆
          </span>
        </motion.div>
      </motion.div>

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.2 : 0.4, delay: 0.15 }}
        className="mt-5"
      >
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-500">{championLabel}</p>
        {winner && <h1 className="mt-1 font-display text-3xl font-bold text-[#fbf6e8] sm:text-4xl">{winner.name}</h1>}
      </motion.div>

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.2 : 0.4, delay: 0.25 }}
        className="mt-7 rounded-card border border-gold-500/20 bg-glass-gold p-5 shadow-premium-lg backdrop-blur-md sm:p-7"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon="⚡" label={xpLabel} value={`+${xpEarned}`} />
          <StatTile icon="🪙" label={coinsLabel} value={`+${coinsEarned}`} />
          <StatTile icon="🎯" label={accuracyLabel} value={`${accuracyPct}%`} />
          <StatTile icon="⏱️" label={reactionLabel} value={`${reactionSeconds.toFixed(1)}${secondsShort}`} />
        </div>
      </motion.div>

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.2 : 0.4, delay: 0.35 }}
        className="mt-5 rounded-card border border-white/10 bg-white/[0.04] p-5 text-left shadow-premium sm:p-7"
      >
        <BattleLeaderboard heading={topThreeHeading} entries={topThree} />
        {rest.length > 0 && (
          <div className="mt-4">
            <BattleLeaderboard heading={playersHeading} entries={rest} />
          </div>
        )}
      </motion.div>

      <motion.button
        type="button"
        onClick={onLeave}
        whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        className="mt-7 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-7 py-3.5 text-sm font-bold text-navy-900 shadow-gold outline-none transition-shadow hover:shadow-[0_0_36px_rgba(232,193,95,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
      >
        {leaveLabel}
      </motion.button>
    </section>
  );
}
