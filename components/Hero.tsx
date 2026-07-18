"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const EMBERS = [
  { left: "8%", size: 3, duration: 9, delay: 0 },
  { left: "18%", size: 2, duration: 11, delay: 1.5 },
  { left: "30%", size: 2.5, duration: 8, delay: 3 },
  { left: "66%", size: 2, duration: 10, delay: 0.8 },
  { left: "78%", size: 3, duration: 12, delay: 2.2 },
  { left: "90%", size: 2, duration: 9.5, delay: 4 },
  { left: "48%", size: 2, duration: 10.5, delay: 5 },
  { left: "24%", size: 1.6, duration: 13, delay: 6 },
  { left: "72%", size: 1.6, duration: 11.5, delay: 2.8 },
];

const SPARKLES = [
  { top: "6%", left: "20%", size: 10, duration: 3.2, delay: 0 },
  { top: "14%", left: "80%", size: 8, duration: 3.8, delay: 0.6 },
  { top: "42%", left: "10%", size: 7, duration: 3.4, delay: 1.4 },
  { top: "48%", left: "90%", size: 9, duration: 4, delay: 0.9 },
  { top: "2%", left: "52%", size: 6, duration: 3.6, delay: 2 },
];

// Beams of light rising up and outward behind the Menorah — not a
// spinning pinwheel, a slow, reverent upward glow.
const RAY_BEAMS = [-56, -38, -20, 0, 20, 38, 56];

// Seven flame positions along the Menorah's crossbar (in the 480x420
// illustration's own coordinate space), the center one taller.
const FLAMES = [
  { x: 135, scale: 0.82, delay: 0.3 },
  { x: 170, scale: 0.9, delay: 0.9 },
  { x: 205, scale: 0.96, delay: 0.1 },
  { x: 240, scale: 1.15, delay: 0.5 },
  { x: 275, scale: 0.96, delay: 0.7 },
  { x: 310, scale: 0.9, delay: 0.2 },
  { x: 345, scale: 0.82, delay: 1.0 },
];

function flameOuterPath(x: number, scale: number) {
  const tipY = 72 - 30 * scale;
  const midY = 72 - 24 * scale;
  const waistY = 72 - 14 * scale;
  const w = 6 * scale;
  return `M${x - w} 72 C${x - w} ${waistY} ${x - w * 0.5} ${midY} ${x} ${tipY} C${x + w * 0.5} ${midY} ${x + w} ${waistY} ${x + w} 72 Z`;
}

function flameInnerPath(x: number, scale: number) {
  const tipY = 72 - 18 * scale;
  const midY = 72 - 14 * scale;
  const waistY = 72 - 8 * scale;
  const w = 3.3 * scale;
  return `M${x - w} 72 C${x - w} ${waistY} ${x - w * 0.5} ${midY} ${x} ${tipY} C${x + w * 0.5} ${midY} ${x + w} ${waistY} ${x + w} 72 Z`;
}

export default function Hero({ onStart, onLeaderboard }: { onStart: () => void; onLeaderboard: () => void }) {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  // Subtle mouse parallax on desktop pointers only, and only when the
  // user hasn't asked for reduced motion — a few px of drift, never
  // enough to distract or affect layout/readability.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const parallaxX = useSpring(rawX, { stiffness: 40, damping: 20 });
  const parallaxY = useSpring(rawY, { stiffness: 40, damping: 20 });
  const sceneX = useTransform(parallaxX, (v) => v * 0.3);
  const sceneY = useTransform(parallaxY, (v) => v * 0.2);

  useEffect(() => {
    if (
      reduceMotion ||
      typeof window === "undefined" ||
      !window.matchMedia("(pointer: fine)").matches
    ) {
      return;
    }

    function handleMove(e: MouseEvent) {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      rawX.set(relX * 14);
      rawY.set(relY * 10);
    }

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [rawX, rawY, reduceMotion]);

  const loop = (duration: number, extra: Record<string, unknown> = {}) =>
    reduceMotion ? { duration: 0 } : { duration, repeat: Infinity, ease: "easeInOut", ...extra };

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative overflow-hidden px-5 pt-16 pb-20 text-center sm:pt-24"
    >
      {/* ambient atmosphere: bloom, purple haze, fog, embers, vignette */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-28 h-[440px] w-[440px] rounded-full bg-gold-500/25 blur-3xl"
          animate={reduceMotion ? undefined : { scale: [1, 1.1, 1], opacity: [0.55, 0.85, 0.55] }}
          transition={loop(8)}
        />
        <motion.div
          className="absolute top-1/4 -right-40 h-[480px] w-[480px] rounded-full bg-purple-500/20 blur-3xl"
          animate={reduceMotion ? undefined : { scale: [1.05, 0.95, 1.05], opacity: [0.5, 0.8, 0.5] }}
          transition={loop(9, { delay: 1 })}
        />
        <div
          className="absolute inset-x-0 top-0 h-[70%]"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, rgba(232,193,95,0.09) 0%, rgba(8,13,34,0) 70%)",
          }}
        />
        <motion.div
          className="absolute left-[-20%] top-[62%] h-32 w-[140%] rounded-[100%] bg-white/[0.035] blur-3xl"
          animate={reduceMotion ? undefined : { x: ["-4%", "4%", "-4%"] }}
          transition={loop(16)}
        />
        <motion.div
          className="absolute left-[-25%] top-[76%] h-24 w-[130%] rounded-[100%] bg-purple-200/[0.03] blur-3xl"
          animate={reduceMotion ? undefined : { x: ["3%", "-5%", "3%"] }}
          transition={loop(20, { delay: 2 })}
        />
        {EMBERS.map((p, i) => (
          <motion.span
            key={i}
            className="absolute bottom-0 rounded-full bg-gold-300/70"
            style={{ left: p.left, width: p.size, height: p.size }}
            animate={reduceMotion ? undefined : { y: ["0%", "-420%"], opacity: [0, 0.8, 0] }}
            transition={loop(p.duration, { delay: p.delay })}
          />
        ))}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 20%, rgba(8,13,34,0) 40%, rgba(8,13,34,0.55) 100%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-500"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse" />
        {t.hero.eyebrow}
      </motion.div>

      {/* ============ THE CENTERPIECE ILLUSTRATION ============ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="relative mx-auto mt-4 h-72 sm:h-96 md:h-[30rem]"
        aria-hidden="true"
      >
        {/* heavenly rays rising up and outward, behind everything */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{ x: sceneX, y: sceneY }}
        >
          {RAY_BEAMS.map((deg, i) => (
            <motion.div
              key={deg}
              className="absolute bottom-[8%] left-1/2 h-[85%] w-3 origin-bottom blur-md sm:w-4"
              style={{
                background:
                  "linear-gradient(to top, rgba(232,193,95,0.4), rgba(232,193,95,0.08) 55%, rgba(232,193,95,0) 100%)",
                transform: `translateX(-50%) rotate(${deg}deg)`,
              }}
              animate={reduceMotion ? undefined : { opacity: [0.35, 0.75, 0.35] }}
              transition={loop(6 + i * 0.4, { delay: i * 0.3 })}
            />
          ))}

          {/* large gold + purple volumetric bloom behind the whole scene */}
          <motion.div
            className="absolute left-1/2 top-[38%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-90 blur-3xl sm:h-[420px] sm:w-[420px]"
            style={{
              background:
                "radial-gradient(circle, rgba(232,193,95,0.32) 0%, rgba(139,92,246,0.16) 45%, rgba(8,13,34,0) 75%)",
            }}
            animate={reduceMotion ? undefined : { scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] }}
            transition={loop(7)}
          />

          {SPARKLES.map((s, i) => (
            <motion.div
              key={i}
              className="absolute text-gold-200"
              style={{ top: s.top, left: s.left, width: s.size, height: s.size }}
              animate={reduceMotion ? undefined : { opacity: [0, 1, 0], scale: [0.6, 1.1, 0.6] }}
              transition={loop(s.duration, { delay: s.delay })}
            >
              <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-[0_0_6px_rgba(232,193,95,0.8)]">
                <path
                  d="M12 1c.6 4.2 2 7 5.5 8.5C14 11 12.6 13.8 12 18c-.6-4.2-2-7-5.5-8.5C10 8 11.4 5.2 12 1Z"
                  fill="currentColor"
                />
              </svg>
            </motion.div>
          ))}
        </motion.div>

        {/* grounding contact shadow beneath the book */}
        <div
          className="absolute bottom-[6%] left-1/2 h-8 w-56 -translate-x-1/2 rounded-[100%] bg-black/40 blur-xl sm:w-72"
          aria-hidden
        />

        {/* the illustration itself: open Bible with the Menorah rising from it */}
        <svg
          viewBox="0 0 480 420"
          preserveAspectRatio="xMidYMid meet"
          className="relative z-10 mx-auto h-full max-w-[460px]"
        >
          <defs>
            <linearGradient id="goldMetal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff3c4" />
              <stop offset="45%" stopColor="#e8c15f" />
              <stop offset="100%" stopColor="#a9781f" />
            </linearGradient>
            <linearGradient id="pageGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff8e6" />
              <stop offset="100%" stopColor="#eccf8f" />
            </linearGradient>
            <linearGradient id="spineShadow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7a5a1e" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#7a5a1e" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="pageGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffe9a8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffe9a8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="flameOuter" cx="50%" cy="85%" r="75%">
              <stop offset="0%" stopColor="#ffe9a8" />
              <stop offset="45%" stopColor="#f7b955" />
              <stop offset="100%" stopColor="#e8742c" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="flameInner" cx="50%" cy="75%" r="75%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#fff2c2" />
              <stop offset="100%" stopColor="#ffdd80" stopOpacity="0" />
            </radialGradient>
            <filter id="softBlur" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3.2" />
            </filter>
            <filter id="wideBlur" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>

          {/* soft glow spilling up from the open pages */}
          <ellipse cx="240" cy="255" rx="150" ry="90" fill="url(#pageGlow)" filter="url(#wideBlur)" />

          {/* the Menorah — seven branches sharing one crossbar height */}
          <g>
            <path d="M215 300 L265 300 L253 282 L227 282 Z" fill="url(#goldMetal)" />
            <path d="M240 300 L240 70" stroke="url(#goldMetal)" strokeWidth="15" strokeLinecap="round" />
            <path
              d="M240 260 C265 258 275 200 275 140 C275 110 275 90 275 70"
              stroke="url(#goldMetal)"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M240 230 C290 225 310 170 310 120 C310 95 310 82 310 70"
              stroke="url(#goldMetal)"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M240 200 C310 195 345 150 345 110 C345 90 345 80 345 70"
              stroke="url(#goldMetal)"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M240 260 C215 258 205 200 205 140 C205 110 205 90 205 70"
              stroke="url(#goldMetal)"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M240 230 C190 225 170 170 170 120 C170 95 170 82 170 70"
              stroke="url(#goldMetal)"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M240 200 C170 195 135 150 135 110 C135 90 135 80 135 70"
              stroke="url(#goldMetal)"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* seven oil cups and their glowing, flickering flames */}
          {FLAMES.map((f) => (
            <g key={f.x}>
              <ellipse cx={f.x} cy="72" rx={7 * f.scale} ry={3.2 * f.scale} fill="url(#goldMetal)" />
              <motion.g
                style={{ transformOrigin: `${f.x}px 72px` }}
                animate={
                  reduceMotion
                    ? undefined
                    : { scaleY: [1, 1.12, 0.94, 1.05, 1], opacity: [0.92, 1, 0.85, 0.97, 0.92] }
                }
                transition={loop(1.6 + (f.x % 7) * 0.15, { delay: f.delay })}
              >
                <circle cx={f.x} cy={72 - 16 * f.scale} r={13 * f.scale} fill="#ffb347" opacity="0.45" filter="url(#softBlur)" />
                <path d={flameOuterPath(f.x, f.scale)} fill="url(#flameOuter)" filter="url(#softBlur)" />
                <path d={flameInnerPath(f.x, f.scale)} fill="url(#flameInner)" />
              </motion.g>
            </g>
          ))}

          {/* the open Bible, illuminated from within */}
          <path d="M236 292 L236 392 L244 392 L244 292 Z" fill="url(#spineShadow)" />
          <path
            d="M70 302 C110 276 190 271 238 293 L238 388 C190 372 110 378 70 397 Z"
            fill="url(#pageGradient)"
            stroke="#c9a15c"
            strokeWidth="1"
          />
          <path
            d="M410 302 C370 276 290 271 242 293 L242 388 C290 372 370 378 410 397 Z"
            fill="url(#pageGradient)"
            stroke="#c9a15c"
            strokeWidth="1"
          />
          <g stroke="#8a6a30" strokeWidth="1.1" opacity="0.45" strokeLinecap="round">
            <path d="M92 316 h120M92 328 h112M92 340 h118M92 352 h100M92 364 h108" />
            <path d="M388 316 h-120M388 328 h-112M388 340 h-118M388 352 h-100M388 364 h-108" />
          </g>
        </svg>
      </motion.div>
      {/* ============ END CENTERPIECE ILLUSTRATION ============ */}

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="relative mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight text-[#fbf6e8] sm:text-5xl md:text-6xl"
      >
        Menorah{" "}
        <span className="text-gold-500 drop-shadow-[0_0_28px_rgba(232,193,95,0.45)]">
          Bible Quiz
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.22 }}
        className="mx-auto mt-3 max-w-md text-base font-medium text-gold-300/90"
      >
        {t.tagline}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.28 }}
        className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-[#c6cbd6]"
      >
        {t.slogan}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.34 }}
        className="mt-9 flex flex-wrap items-center justify-center gap-4"
      >
        <motion.button
          onClick={onStart}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-9 py-3.5 text-[15px] font-bold text-navy-900 shadow-gold outline-none transition-shadow duration-300 hover:shadow-[0_0_50px_rgba(232,193,95,0.7)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          {t.hero.startButton}
        </motion.button>
        <motion.button
          onClick={onLeaderboard}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-full border border-gold-500/50 px-7 py-3.5 text-[15px] font-semibold text-gold-500 outline-none transition-all duration-300 hover:border-gold-400 hover:bg-gold-500/10 hover:shadow-[0_0_30px_rgba(232,193,95,0.35)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          {t.hero.leaderboardButton}
        </motion.button>
      </motion.div>

      <div className="mx-auto mt-14 grid max-w-md grid-cols-3 gap-4">
        {[
          ["10", t.hero.statCategories],
          ["10+", t.hero.statQuestions],
          ["Free", t.hero.statFree],
        ].map(([value, label], i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 + i * 0.06 }}
            whileHover={{ y: -3 }}
            className="rounded-2xl border border-gold-500/20 bg-white/5 px-3 py-5 shadow-premium transition-colors hover:border-gold-500/40"
          >
            <div className="font-display text-2xl font-bold text-gold-500">{value}</div>
            <div className="mt-1 text-xs text-[#aab1c0]">{label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
