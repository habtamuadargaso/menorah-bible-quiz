"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

// A single circular progress ring (Apple-Fitness-style) used twice in the
// Daily Goal section — once for questions, once for XP.
const CircularGoalRing = memo(function CircularGoalRing({
  pct,
  color,
  label,
  valueText,
  delay = 0,
}: {
  pct: number; // 0-100
  color: string;
  label: string;
  valueText: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, pct));
  const size = 112;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const complete = clamped >= 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            style={{ filter: complete ? `drop-shadow(0 0 8px ${color}aa)` : undefined }}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: reduceMotion ? circumference * (1 - clamped / 100) : circumference }}
            animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-display text-lg font-bold text-[#fbf6e8]">{Math.round(clamped)}%</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold text-[#f3efe2]">{valueText}</div>
        <div className="text-[11px] uppercase tracking-wide text-[#9aa1b0]">{label}</div>
      </div>
    </div>
  );
});

export default CircularGoalRing;
