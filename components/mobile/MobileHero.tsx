"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import heroArtwork from "@/public/images/menorah-hero.webp";

// Mission 15.5 — premium mobile dashboard hero. Replaces the plain "Play"
// section header with a greeting + brand moment + at-a-glance progress,
// using only data already computed by app/page.tsx (lib/progress.ts /
// lib/profileStats.ts). No new business logic, no backend calls.
function greeting(isAmharic: boolean) {
  const hour = new Date().getHours();
  if (isAmharic) {
    if (hour < 12) return " እንደምን አደሩ";
    if (hour < 18) return "እንደምን ዋሉ";
    return "እንደምን አመሹ";
  }
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

// Mission 18 — floating gold particles scattered across the hero
// illustration's corner, not the whole card, so they read as "sparkle
// coming off the Menorah" rather than a generic starfield.
const STAR_DOTS = [
  { top: "12%", left: "68%", delay: 0 },
  { top: "58%", left: "78%", delay: 1.1 },
  { top: "22%", left: "88%", delay: 0.5 },
  { top: "70%", left: "60%", delay: 1.6 },
];

export default function MobileHero({
  displayName,
  isGuest,
  isAmharic,
  level,
  progressPct,
  coins,
  streak,
  onContinue,
}: {
  displayName: string;
  isGuest: boolean;
  isAmharic: boolean;
  level: number;
  progressPct: number;
  coins: number;
  streak: number;
  /** Optional — reuses whatever "jump into a quiz" handler the caller already owns (e.g. router.push("/learn")). No new navigation is invented here. */
  onContinue?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const name = isGuest ? (isAmharic ? "እንግዳ" : "Guest") : displayName;

  return (
    <motion.section
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative mx-4 mt-3 overflow-hidden rounded-card border border-gold-500/30 bg-gradient-to-br from-gold-500/20 via-navy-900/50 to-purple-500/15 px-5 py-5 shadow-premium"
    >
      {/* Mission 18 — premium hero illustration: the same glowing Menorah
          over an open Bible used on desktop (public/images/menorah-hero.webp),
          cropped to its top-center (the Menorah + light rays, not the full
          book) and confined to the upper-right corner behind a radial fade
          so it reads as ambient art, not a rectangle sitting on top of the
          greeting/title/buttons below it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 opacity-[0.55]"
        style={{
          maskImage: "radial-gradient(circle at 65% 35%, black 35%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(circle at 65% 35%, black 35%, transparent 72%)",
        }}
      >
        <Image
          src={heroArtwork}
          alt=""
          fill
          sizes="144px"
          className="object-cover object-top"
        />
      </div>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gold-500/30 blur-3xl"
        animate={reduceMotion ? undefined : { opacity: [0.5, 0.9, 0.5] }}
        transition={reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div aria-hidden className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-purple-500/20 blur-3xl" />

      {!reduceMotion &&
        STAR_DOTS.map((dot, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="pointer-events-none absolute h-1 w-1 rounded-full bg-gold-200"
            style={{ top: dot.top, left: dot.left }}
            animate={{ opacity: [0.1, 0.8, 0.1] }}
            transition={{ duration: 3.2, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
          {greeting(isAmharic)}, {name}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-[#fbf6e8]">
          Menorah <span className="text-gold-500">Bible Quiz</span>
        </h1>
        <p className="mt-1 text-[13px] italic text-[#c6cbd6]">
          {isAmharic ? "በእግዚአብሔር ቃል በየቀኑ አድጉ።" : "Grow in God's Word every day."}
        </p>

        <div className="mt-4 flex items-center gap-2.5">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-gold-500/25 bg-navy-950/40 px-3 py-2">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold-500/20 text-[10px] font-bold text-gold-400">
              {level}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-gold-500/25 bg-navy-950/40 px-2.5 py-2 text-xs font-bold text-gold-300">
            <span aria-hidden>🪙</span>
            {coins}
          </div>

          <div className="flex items-center gap-1 rounded-full border border-streak-500/30 bg-navy-950/40 px-2.5 py-2 text-xs font-bold text-streak-300">
            <span aria-hidden>🔥</span>
            {streak}
          </div>
        </div>

        {onContinue && (
          <motion.button
            onClick={onContinue}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            animate={
              reduceMotion
                ? undefined
                : { boxShadow: ["0 0 0px rgba(232,193,95,0.35)", "0 0 22px rgba(232,193,95,0.55)", "0 0 0px rgba(232,193,95,0.35)"] }
            }
            transition={reduceMotion ? undefined : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="mt-4 w-full rounded-full bg-gradient-to-br from-gold-300 to-gold-600 py-3 text-sm font-bold text-navy-900 outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {isAmharic ? "ጉዞውን ይቀጥሉ" : "Continue Journey"} ▶
          </motion.button>
        )}
      </div>
    </motion.section>
  );
}
