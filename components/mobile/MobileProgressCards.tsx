"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Coins, Flame } from "lucide-react";
import AnimatedNumber from "./AnimatedNumber";
import ValuePulse from "./ValuePulse";

// Mission 15.5 — richer replacement for the old plain "Your Progress"
// MobileStatCard row. Same three numbers as before (player level + XP
// progress, coins, day streak), just with a circular XP ring, uniform
// lucide iconography, and small entrance/tap motion. All values are passed
// in from real state already loaded by app/page.tsx — nothing fabricated.
function XpRing({ progressPct, level }: { progressPct: number; level: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, progressPct)) / 100) * circumference;

  return (
    <div className="relative h-14 w-14 flex-shrink-0">
      <svg viewBox="0 0 52 52" className="h-14 w-14 -rotate-90">
        <circle cx="26" cy="26" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
        <motion.circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          stroke="url(#xp-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
        />
        <defs>
          <linearGradient id="xp-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c9b6ff" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-display text-base font-bold text-[#fbf6e8]">
        <ValuePulse value={level}>{level}</ValuePulse>
      </div>
    </div>
  );
}

export default function MobileProgressCards({
  level,
  progressPct,
  coins,
  streak,
  levelLabel,
  coinsLabel,
  streakLabel,
}: {
  level: number;
  progressPct: number;
  coins: number;
  streak: number;
  levelLabel: string;
  coinsLabel: string;
  streakLabel: string;
}) {
  const reduceMotion = useReducedMotion();
  const cardClass =
    "flex flex-1 flex-col items-center gap-1.5 rounded-card-sm border border-gold-500/20 bg-glass-gold px-3 py-3.5 text-center shadow-premium";

  return (
    <div className="flex gap-2.5">
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        className={cardClass}
      >
        <XpRing progressPct={progressPct} level={level} />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa1b0]">{levelLabel}</span>
      </motion.div>

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.06 }}
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        className={cardClass}
      >
        <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gold-500/15">
          <Coins className="h-6 w-6 text-gold-400" strokeWidth={1.8} aria-hidden />
        </span>
        <span className="font-display text-lg font-bold text-[#fbf6e8]">
          <ValuePulse value={coins}>
            <AnimatedNumber value={coins} />
          </ValuePulse>
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa1b0]">{coinsLabel}</span>
      </motion.div>

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.12 }}
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        className={cardClass}
      >
        <span
          className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full ${
            streak > 0 ? "bg-gradient-to-br from-streak-500/25 to-transparent" : "bg-white/[0.06]"
          }`}
        >
          <Flame
            className={`h-6 w-6 ${streak > 0 ? "text-streak-400" : "text-[#6b7280]"}`}
            strokeWidth={1.8}
            aria-hidden
          />
        </span>
        <span className="font-display text-lg font-bold text-[#fbf6e8]">
          <ValuePulse value={streak}>
            <AnimatedNumber value={streak} />
          </ValuePulse>
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa1b0]">{streakLabel}</span>
      </motion.div>
    </div>
  );
}
