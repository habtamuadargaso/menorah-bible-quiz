"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  canClaimDailyReward,
  claimDailyReward,
  DAILY_REWARDS,
  loadDailyReward,
  type DailyRewardState,
} from "@/lib/dailyReward";
import { hapticLight } from "@/lib/mobile/haptics";

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
