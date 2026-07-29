"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import heroArtwork from "@/public/images/menorah-hero-premium.webp";

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

// Mission 18.5 — sparkle dots scattered across the illustration's footprint
// (not the whole card) so they read as light coming off the Menorah.
const STAR_DOTS = [
  { top: "6%", left: "58%", delay: 0 },
  { top: "34%", left: "88%", delay: 1.1 },
  { top: "14%", left: "76%", delay: 0.5 },
  { top: "52%", left: "66%", delay: 1.6 },
  { top: "44%", left: "94%", delay: 0.8 },
];

export default function MobileHero({
  displayName,
  isGuest,
  isAmharic,
  level,
  progressPct,
  xpIntoLevel,
  xpForNextLevel,
  coins,
  streak,
  onContinue,
}: {
  displayName: string;
  isGuest: boolean;
  isAmharic: boolean;
  level: number;
  progressPct: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
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
      className="relative mx-4 mt-3 overflow-hidden rounded-card border border-gold-500/30 bg-gradient-to-br from-gold-500/20 via-navy-900/60 to-purple-500/15 px-5 pb-5 pt-5 shadow-premium"
    >
      {/* ambient depth behind the illustration — kept soft so the vector art above stays the brightest thing in the card */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-gold-500/25 blur-3xl"
        animate={reduceMotion ? undefined : { opacity: [0.5, 0.9, 0.5] }}
        transition={reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div aria-hidden className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-purple-500/20 blur-3xl" />

      {/* Mission 19.1 — the approved hero artwork (public/images/menorah-hero-premium.webp,
          an unmodified photo — not recreated or redrawn). The source frame
          already has an empty dark-navy left two-thirds and the full
          Menorah + open Bible on the right, so `object-position: right`
          only trims that empty margin — the container's aspect ratio
          (~0.9, well under the source's own 1.5:1) means `cover` scales to
          the FULL source height first, so the Menorah's tallest flame and
          the Bible's base are both always inside frame; nothing is ever
          cropped. Only the left few percent gets a soft mask fade, so the
          photo blends into the card's own gradient instead of showing a
          hard edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-3 -top-3 h-[190px] w-[172px] overflow-hidden rounded-2xl sm:h-[210px] sm:w-[190px]"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 12%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 12%)",
        }}
      >
        <Image
          src={heroArtwork}
          alt=""
          fill
          sizes="(max-width: 640px) 172px, 190px"
          className="object-cover"
          style={{ objectPosition: "right center" }}
          priority
        />
        {/* Mission 19.1 (production pass) — a translucent radial tint on TOP
            of the photo, not a mask: it can only ever darken pixels toward
            the corners, never hide them, so the Menorah/flames/Bible stay
            fully visible no matter how the gradient stops are tuned. This
            is what does the "soft radial gradient / navy overlay / warm
            glow" blending the photo into the card, in addition to the left
            mask fade above. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 100% at 62% 55%, transparent 55%, rgba(8,13,34,0.35) 100%), radial-gradient(60% 45% at 55% 78%, rgba(232,193,95,0.18) 0%, transparent 70%)",
          }}
        />
      </div>

      {!reduceMotion &&
        STAR_DOTS.map((dot, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="pointer-events-none absolute h-1 w-1 rounded-full bg-gold-200"
            style={{ top: dot.top, left: dot.left }}
            animate={{ opacity: [0.1, 0.9, 0.1], scale: [0.8, 1.3, 0.8] }}
            transition={{ duration: 3, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

      <div className="relative max-w-[60%] sm:max-w-[56%]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
          {greeting(isAmharic)}, {name}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-[#fbf6e8]">
          Menorah <span className="text-gold-500">Bible Quiz</span>
        </h1>
        <p className="mt-1 text-[13px] italic text-[#c6cbd6]">
          {isAmharic ? "በእግዚአብሔር ቃል በየቀኑ አድጉ።" : "Grow in God's Word every day."}
        </p>
      </div>

      {/* Mission 18.5 — circular level indicator + XP fraction + progress
          bar sit below the illustration's footprint, full width, so
          nothing here is ever covered by the art above. */}
      <div className="relative mt-4 flex items-center gap-3">
        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-gold-400/60 bg-navy-950/60 font-display text-lg font-bold text-gold-300 shadow-gold">
          {level}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#c6cbd6]">
            <span>{xpIntoLevel.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP</span>
            <span className="text-gold-400">{progressPct}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-gold-300 via-gold-400 to-gold-600"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
            />
          </div>
        </div>
      </div>

      <div className="relative mt-3 grid grid-cols-3 gap-2">
        <div className="flex items-center justify-center gap-1.5 rounded-full border border-gold-500/25 bg-navy-950/40 px-2 py-2 text-xs font-bold text-gold-300">
          <span aria-hidden>🪙</span>
          {coins}
        </div>
        <div className="flex items-center justify-center gap-1.5 rounded-full border border-purple-400/25 bg-navy-950/40 px-2 py-2 text-xs font-bold text-purple-200">
          <span aria-hidden>⭐</span>
          {isAmharic ? "ደረጃ" : "Lvl"} {level}
        </div>
        <div className="flex items-center justify-center gap-1.5 rounded-full border border-streak-500/30 bg-navy-950/40 px-2 py-2 text-xs font-bold text-streak-300">
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
              : { boxShadow: ["0 0 0px rgba(232,193,95,0.35)", "0 0 26px rgba(232,193,95,0.6)", "0 0 0px rgba(232,193,95,0.35)"] }
          }
          transition={reduceMotion ? undefined : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="relative mt-4 w-full overflow-hidden rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-gold-600 py-3 text-sm font-bold text-navy-900 outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent" />
          <span className="relative">
            {isAmharic ? "ጉዞውን ይቀጥሉ" : "Continue Journey"} ▶
          </span>
        </motion.button>
      )}
    </motion.section>
  );
}
