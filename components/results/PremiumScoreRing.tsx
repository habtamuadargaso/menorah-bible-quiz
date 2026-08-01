"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import AnimatedNumber from "@/components/mobile/AnimatedNumber";

const PARTICLES = Array.from({ length: 10 }, (_, index) => {
  const angle = (index / 10) * Math.PI * 2;
  return { x: Math.cos(angle) * 86, y: Math.sin(angle) * 70, delay: (index % 5) * 0.05 };
});

export default function PremiumScoreRing({ score, correct, total, headline, pointsLabel }: { score: number; correct: number; total: number; headline: string; pointsLabel: string }) {
  const reduceMotion = useReducedMotion();
  const gradientId = useId().replace(/:/g, "");
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const radius = 66;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-gold-500/35 bg-[#0a1730]/95 px-5 py-7 shadow-[0_24px_60px_rgba(0,0,0,0.38),0_0_38px_rgba(232,193,95,0.1)]">
      {!reduceMotion && <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">{PARTICLES.map((particle, index) => <motion.span key={index} className="absolute h-1.5 w-1.5 rounded-full bg-gold-300" initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }} animate={{ opacity: [0, 1, 0], x: particle.x, y: particle.y, scale: [0.4, 1, 0.5] }} transition={{ duration: 1.1, delay: particle.delay, ease: "easeOut" }} />)}</div>}
      <p className="relative font-display text-3xl font-bold text-[#fbf6e8]">{headline}</p>
      <div className="relative mx-auto mt-5 h-40 w-40" role="img" aria-label={`${correct} of ${total} correct, ${pct}% accuracy, ${score} points`}>
        <svg aria-hidden viewBox="0 0 152 152" className="h-full w-full -rotate-90 drop-shadow-[0_0_18px_rgba(232,193,95,0.35)]">
          <circle cx="76" cy="76" r={radius} fill="#081329" stroke="rgba(255,255,255,0.09)" strokeWidth="8" />
          <motion.circle cx="76" cy="76" r={radius} fill="none" stroke={`url(#${gradientId})`} strokeLinecap="round" strokeWidth="8" strokeDasharray={circumference} initial={{ strokeDashoffset: reduceMotion ? circumference * (1 - pct / 100) : circumference }} animate={{ strokeDashoffset: circumference * (1 - pct / 100) }} transition={{ duration: reduceMotion ? 0 : 1, delay: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }} />
          <defs><linearGradient id={gradientId}><stop stopColor="#f6d77d" /><stop offset="1" stopColor="#c99a2e" /></linearGradient></defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold text-gold-300"><AnimatedNumber value={score} duration={0.9} startFromZero /></span>
          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#929bad]">{pointsLabel}</span>
        </div>
      </div>
      <p className="relative mt-3 font-display text-2xl font-bold text-[#f4efe2]">{correct} <span className="text-[#747e91]">/</span> {total}</p>
    </div>
  );
}
