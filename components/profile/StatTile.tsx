"use client";

import { memo, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// One stat card in the Player Statistics grid, with a self-contained
// count-up animation (immediate under reduced motion). Memoized so the
// grid doesn't re-render every tile when only one value changes.
const StatTile = memo(function StatTile({
  icon,
  label,
  value,
  suffix = "",
  tone = "neutral",
  delay = 0,
}: {
  icon: string;
  label: string;
  value: number;
  suffix?: string;
  tone?: "gold" | "purple" | "emerald" | "neutral";
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const duration = 800;
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, reduceMotion]);

  const toneClasses: Record<string, string> = {
    gold: "text-gold-400",
    purple: "text-purple-200",
    emerald: "text-emerald-300",
    neutral: "text-[#f3efe2]",
  };

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.95 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={reduceMotion ? { duration: 0.2, delay } : { duration: 0.4, delay, ease: "easeOut" }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-4 text-center shadow-[0_4px_18px_rgba(0,0,0,0.22)] transition-colors hover:border-gold-500/30"
    >
      <div className="text-lg" aria-hidden>
        {icon}
      </div>
      <div className={`mt-1 font-display text-xl font-bold ${toneClasses[tone]}`}>
        {display}
        {suffix}
      </div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-[#9aa1b0]">{label}</div>
    </motion.div>
  );
});

export default StatTile;
