"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { canClaimDailyReward, claimDailyReward, DAILY_REWARDS, loadDailyReward, type DailyRewardState } from "@/lib/dailyReward";

export default function DailyReward() {
  const [state, setState] = useState<DailyRewardState>({ lastClaimDate: null, streak: 0 });
  const [message, setMessage] = useState("Come back daily to build your reward streak.");

  useEffect(() => {
    const current = loadDailyReward();
    setState(current);
    setMessage(canClaimDailyReward(current) ? "Your daily reward is ready." : "Daily reward claimed today. Come back tomorrow.");
  }, []);

  function handleClaim() {
    const result = claimDailyReward();
    if (!result) {
      setMessage("You already claimed today’s reward. Come back tomorrow.");
      return;
    }
    setState(result.state);
    const parts = [];
    if (result.reward.xp) parts.push(`+${result.reward.xp} XP`);
    if (result.reward.coins) parts.push(`+${result.reward.coins} coins`);
    setMessage(`Reward claimed: ${parts.join(" and ")}!`);
  }

  const ready = canClaimDailyReward(state);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-card-sm border border-gold-500/25 bg-glass-gold p-5 shadow-premium"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-gold-400">Daily Reward</div>
          <h3 className="mt-1 font-display text-2xl font-bold text-[#fbf6e8]">Claim your blessing streak</h3>
          <p className="mt-1 text-sm text-[#a7aebd]">{message}</p>
          <div className="mt-2 text-xs text-[#8d94a3]">Current streak: {state.streak} day{state.streak === 1 ? "" : "s"}</div>
        </div>
        <button
          onClick={handleClaim}
          disabled={!ready}
          className={`rounded-full px-6 py-3 text-sm font-bold outline-none transition ${
            ready
              ? "bg-gradient-to-br from-gold-300 to-gold-600 text-navy-900 shadow-gold hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
              : "cursor-not-allowed border border-white/15 text-[#8d94a3]"
          }`}
        >
          {ready ? "Claim Reward" : "Claimed Today"}
        </button>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-7">
        {DAILY_REWARDS.map((reward) => {
          const active = ((state.streak || 1) - 1) % DAILY_REWARDS.length === reward.day - 1;
          return (
            <div
              key={reward.day}
              className={`rounded-2xl border px-3 py-3 text-center ${
                active ? "border-gold-500/60 bg-gold-500/15" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="text-[11px] font-bold uppercase text-gold-400">Day {reward.day}</div>
              <div className="mt-1 text-xs text-[#c6cbd6]">{reward.label}</div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
