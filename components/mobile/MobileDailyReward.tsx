"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Gift } from "lucide-react";
import {
  canClaimDailyReward,
  claimDailyReward,
  DAILY_REWARDS,
  loadDailyReward,
  type DailyRewardState,
} from "@/lib/dailyReward";
import { hapticLight } from "@/lib/mobile/haptics";

// Mission 18.5 — a handful of small, always-on sparkle dots around the
// chest icon (distinct from ConfettiBurst below, which only plays once on
// claim) so the card reads as "treasure" even before the player taps Claim.
const AMBIENT_SPARKLES = [
  { top: "8%", left: "22%", delay: 0 },
  { top: "68%", left: "18%", delay: 0.9 },
  { top: "20%", left: "78%", delay: 0.5 },
  { top: "70%", left: "80%", delay: 1.4 },
];

// Mission 15.5 — premium mobile-only presentation of the same
// lib/dailyReward.ts claim flow already used by components/DailyReward.tsx
// (desktop). No reward math changes; this just gives the claim button a
// gold glow, a small confetti burst, and a floating coin/XP animation on
// mobile, in place of the plain button + text used before.
function ConfettiBurst() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        angle: (360 / 18) * i,
        distance: 40 + Math.random() * 30,
        size: 4 + Math.random() * 4,
        color: ["#f0c868", "#e8c15f", "#ffffff", "#c99a2e"][i % 4],
      })),
    []
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const x = Math.cos(rad) * p.distance;
        const y = Math.sin(rad) * p.distance;
        return (
          <motion.span
            key={p.id}
            className="absolute rounded-sm"
            style={{ width: p.size, height: p.size, background: p.color }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x, y, opacity: 0, rotate: 180 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

export default function MobileDailyReward({ isAmharic }: { isAmharic: boolean }) {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState<DailyRewardState>({ lastClaimDate: null, streak: 0 });
  const [burst, setBurst] = useState(false);
  const [floatText, setFloatText] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setState(loadDailyReward());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const ready = canClaimDailyReward(state);

  function handleClaim() {
    hapticLight();
    const result = claimDailyReward();
    if (!result) return;
    setState(result.state);
    const parts: string[] = [];
    if (result.reward.xp) parts.push(`+${result.reward.xp} XP`);
    if (result.reward.coins) parts.push(`+${result.reward.coins} 🪙`);
    setFloatText(parts.join("  "));
    if (!reduceMotion) {
      setBurst(true);
      window.setTimeout(() => setBurst(false), 850);
    }
    window.setTimeout(() => setFloatText(null), 1400);
  }

  return (
    <div className="relative overflow-visible rounded-card-sm border border-amber-400/25 bg-glass-streak p-5 shadow-premium">
      {burst && <ConfettiBurst />}

      {/* Mission 18.5 — a glowing chest/gift badge + centered heading above
          the existing streak/claim row (kept exactly as-is below), so the
          card reads as "treasure" the way the approved reference does.
          Mission 20 — the icon itself now bounces and the glow pulses only
          while a reward is actually available, and stop the moment it's
          claimed (both are gated on `ready`, which flips false in
          `handleClaim` above). */}
      <div className="relative mb-4 flex flex-col items-center text-center">
        <motion.div
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 via-gold-500/15 to-transparent"
          animate={ready && !reduceMotion ? { y: [0, -3, 0] } : undefined}
          transition={ready && !reduceMotion ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full bg-amber-500/20 blur-xl"
            animate={ready && !reduceMotion ? { opacity: [0.5, 1, 0.5] } : undefined}
            transition={ready && !reduceMotion ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
          />
          <Gift className="relative h-7 w-7 text-amber-300" strokeWidth={1.8} aria-hidden />
          {ready &&
            !reduceMotion &&
            AMBIENT_SPARKLES.map((s, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="pointer-events-none absolute h-1 w-1 rounded-full bg-gold-200"
                style={{ top: s.top, left: s.left }}
                animate={{ opacity: [0.15, 0.9, 0.15] }}
                transition={{ duration: 2.6, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
        </motion.div>
        <div className="mt-2 font-display text-base font-bold uppercase tracking-wide text-gold-300">
          {isAmharic ? "ዕለታዊ ሽልማት" : "Daily Reward"}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-lg font-bold text-[#fbf6e8]">
            {isAmharic ? `${state.streak} ቀናት ጅረት` : `${state.streak} day streak`}
          </div>
          <div className="mt-0.5 text-xs text-[#8d94a3]">
            {ready
              ? isAmharic
                ? "ዛሬ ሽልማትዎ ተዘጋጅቷል"
                : "Your reward is ready"
              : isAmharic
              ? "ነገ ተመልሰው ይምጡ"
              : "Come back tomorrow"}
          </div>
        </div>

        <div className="relative flex-shrink-0">
          <motion.button
            onClick={handleClaim}
            disabled={!ready}
            whileTap={ready && !reduceMotion ? { scale: 0.94 } : undefined}
            animate={
              ready && !reduceMotion
                ? { boxShadow: ["0 0 0px rgba(232,193,95,0.4)", "0 0 26px rgba(232,193,95,0.65)", "0 0 0px rgba(232,193,95,0.4)"] }
                : undefined
            }
            transition={ready && !reduceMotion ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : undefined}
            className={`rounded-full px-5 py-2.5 text-sm font-bold outline-none transition-colors ${
              ready
                ? "bg-gradient-to-br from-gold-300 to-gold-600 text-navy-900"
                : "cursor-not-allowed border border-white/15 text-[#8d94a3]"
            }`}
          >
            {ready ? (isAmharic ? "ይቀበሉ" : "Claim") : isAmharic ? "ተቀብለዋል" : "Claimed"}
          </motion.button>

          <AnimatePresence>
            {floatText && (
              <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: -22 }}
                exit={{ opacity: 0, y: -34 }}
                transition={{ duration: 0.6 }}
                className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-gold-300"
              >
                {floatText}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {DAILY_REWARDS.map((reward) => {
          const active = ((state.streak || 1) - 1) % DAILY_REWARDS.length === reward.day - 1;
          const isGrandPrize = reward.day === DAILY_REWARDS.length;
          return (
            <div
              key={reward.day}
              className={`relative rounded-lg border py-2 text-center ${
                isGrandPrize
                  ? "border-gold-400/70 bg-gradient-to-br from-gold-500/25 to-purple-500/15"
                  : active
                  ? "border-amber-400/60 bg-amber-500/15"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              {isGrandPrize && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[9px]" aria-hidden>
                  ⭐
                </span>
              )}
              <div className={`text-[9px] font-bold ${isGrandPrize ? "mt-1 text-gold-300" : "text-amber-300"}`}>{reward.day}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
