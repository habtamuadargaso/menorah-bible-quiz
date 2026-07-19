"use client";

import { memo, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Renders a countdown derived purely from a shared server timestamp
 * (`endsAt`) — every client (host TV + every player phone) computes the
 * same remaining seconds independently from this one value instead of
 * running its own 15-second timer, so a mid-round refresh or a slow
 * device never drifts out of sync with the rest of the room.
 */
function computeRemaining(endsAt: string | null): number {
  if (!endsAt) return 0;
  const ms = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 1000));
}

const SharedBattleTimer = memo(function SharedBattleTimer({
  endsAt,
  totalSeconds,
  size = "md",
  timeUpLabel,
}: {
  endsAt: string | null;
  totalSeconds: number;
  size?: "md" | "lg";
  timeUpLabel: string;
}) {
  const reduceMotion = useReducedMotion();
  // Seeded with totalSeconds (not a Date.now()-derived value) so the very
  // first client render matches the server-rendered markup exactly — the
  // real remaining time is only computed once mounted, in the effect below.
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    setRemaining(computeRemaining(endsAt));
    if (!endsAt) return;
    const id = window.setInterval(() => {
      setRemaining(computeRemaining(endsAt));
    }, 250);
    return () => window.clearInterval(id);
  }, [endsAt]);

  const pct = totalSeconds > 0 ? Math.min(1, Math.max(0, remaining / totalSeconds)) : 0;
  const isLow = remaining <= 5 && remaining > 0;
  const dimension = size === "lg" ? 108 : 64;
  const stroke = size === "lg" ? 8 : 6;
  const radius = (dimension - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: dimension, height: dimension }}
      role="timer"
      aria-live="off"
    >
      <svg width={dimension} height={dimension} className="-rotate-90">
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke={isLow ? "#f87171" : "#e8c15f"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: "linear" }}
        />
      </svg>
      <span
        className={`absolute font-display font-bold ${isLow ? "text-red-400" : "text-gold-300"} ${
          size === "lg" ? "text-4xl" : "text-xl"
        }`}
      >
        {remaining > 0 ? remaining : "0"}
      </span>
      {remaining <= 0 && <span className="sr-only">{timeUpLabel}</span>}
    </div>
  );
});

export default SharedBattleTimer;
