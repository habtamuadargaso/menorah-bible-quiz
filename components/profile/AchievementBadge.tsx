"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

// A single achievement badge for the Profile screen — full color + glow
// when earned, faded/grayscale when still locked.
const AchievementBadge = memo(function AchievementBadge({
  icon,
  title,
  description,
  earned,
  delay = 0,
}: {
  icon: string;
  title: string;
  description: string;
  earned: boolean;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={reduceMotion ? { duration: 0.2, delay } : { duration: 0.35, delay, ease: "backOut" }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      className="flex w-[100px] flex-col items-center gap-1.5 rounded-2xl border border-transparent p-2 text-center outline-none transition-colors hover:border-gold-500/20 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
      tabIndex={0}
      role="group"
      aria-label={`${title}${earned ? "" : ` — ${description}`}`}
      title={description}
    >
      <div
        aria-hidden
        className={`flex h-14 w-14 items-center justify-center rounded-full border text-xl transition-all ${
          earned
            ? "border-gold-500/60 bg-gold-500/15 text-gold-300 shadow-[0_0_20px_rgba(232,193,95,0.35)]"
            : "border-white/10 bg-white/[0.03] text-[#525971] grayscale"
        }`}
      >
        {icon}
      </div>
      <div className={`text-[11px] font-semibold leading-snug ${earned ? "text-[#f3efe2]" : "text-[#666d80]"}`}>
        {title}
      </div>
    </motion.div>
  );
});

export default AchievementBadge;
