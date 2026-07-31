"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import heroArtwork from "@/public/images/menorah-hero-premium.webp";
import AnimatedNumber from "./AnimatedNumber";
import ValuePulse from "./ValuePulse";

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
      transition={{ duration: 0.28 }}
      className="relative mx-3 mt-3 overflow-hidden rounded-[30px] border border-gold-500/35 bg-gradient-to-br from-gold-500/[0.16] via-navy-900/80 to-purple-500/10 px-5 pb-5 pt-6 shadow-[0_22px_55px_rgba(0,0,0,0.38)]"
    >
      {/* ambient depth behind the illustration — kept soft so the vector art above stays the brightest thing in the card */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-gold-500/20 blur-3xl"
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
        className="pointer-events-none absolute -right-5 -top-2 h-[210px] w-[190px] overflow-hidden rounded-2xl sm:h-[225px] sm:w-[205px]"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 12%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 12%)",
        }}
      >
        <Image
          src={heroArtwork}
          alt=""
          fill
          sizes="(max-width: 640px) 190px, 205px"
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

      <div className="relative max-w-[58%] sm:max-w-[56%]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
          {greeting(isAmharic)}, {name}
        </p>
        <h1 className="mt-2 font-display text-[28px] font-bold leading-[1.02] tracking-tight text-[#fbf6e8] sm:text-3xl">
          Menorah <span className="text-gold-500">Bible Quiz</span>
        </h1>
        <p className="mt-2 text-[13px] leading-5 text-[#c6cbd6]">
          {isAmharic ? "በእግዚአብሔር ቃል በየቀኑ አድጉ።" : "Grow in God's Word every day."}
        </p>
      </div>

      {/* Mission 18.5 — circular level indicator + XP fraction + progress
          bar sit below the illustration's footprint, full width, so
          nothing here is ever covered by the art above. */}
      <div className="relative mt-7 flex items-center gap-3.5">
        <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-[3px] border-gold-400/70 bg-navy-950/75 font-display text-xl font-bold text-gold-300 shadow-[0_8px_24px_rgba(232,193,95,0.2)]">
          <ValuePulse value={level}>{level}</ValuePulse>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#c6cbd6]">
            <span>
              <AnimatedNumber value={xpIntoLevel} /> / {xpForNextLevel.toLocaleString()} XP
            </span>
            <span className="text-gold-400">{progressPct}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-gold-300 via-gold-400 to-gold-600"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
            />
          </div>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2">
        <div className="flex items-center justify-center gap-1.5 rounded-full border border-gold-500/25 bg-navy-950/40 px-2 py-2 text-xs font-bold text-gold-300">
          <span aria-hidden>🪙</span>
          <ValuePulse value={coins}>
            <AnimatedNumber value={coins} />
          </ValuePulse>
        </div>
        <div className="flex items-center justify-center gap-1.5 rounded-full border border-purple-400/25 bg-navy-950/40 px-2 py-2 text-xs font-bold text-purple-200">
          <span aria-hidden>⭐</span>
          {isAmharic ? "ደረጃ" : "Lvl"} <ValuePulse value={level}>{level}</ValuePulse>
        </div>
        <div className="flex items-center justify-center gap-1.5 rounded-full border border-streak-500/30 bg-navy-950/40 px-2 py-2 text-xs font-bold text-streak-300">
          <span aria-hidden>🔥</span>
          <ValuePulse value={streak}>
            <AnimatedNumber value={streak} />
          </ValuePulse>
        </div>
      </div>

      {onContinue && (
        <motion.button
          onClick={onContinue}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          className="relative mt-4 w-full overflow-hidden rounded-full bg-gradient-to-b from-[#f6d77d] via-gold-400 to-gold-600 py-3.5 text-sm font-bold text-navy-900 shadow-[0_10px_24px_rgba(201,154,46,0.28),inset_0_1px_0_rgba(255,255,255,0.55)] outline-none transition-shadow hover:shadow-[0_12px_28px_rgba(201,154,46,0.36)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
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
