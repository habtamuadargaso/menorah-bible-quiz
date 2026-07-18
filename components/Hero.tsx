"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const PARTICLES = [
  { left: "12%", size: 3, duration: 9, delay: 0 },
  { left: "22%", size: 2, duration: 11, delay: 1.5 },
  { left: "38%", size: 2.5, duration: 8, delay: 3 },
  { left: "58%", size: 2, duration: 10, delay: 0.8 },
  { left: "72%", size: 3, duration: 12, delay: 2.2 },
  { left: "85%", size: 2, duration: 9.5, delay: 4 },
  { left: "48%", size: 2, duration: 10.5, delay: 5 },
  { left: "30%", size: 1.6, duration: 13, delay: 6 },
  { left: "65%", size: 1.6, duration: 11.5, delay: 2.8 },
];

// A simple open-Bible silhouette: two curved pages meeting at a spine,
// with a few faint lines suggesting text.
function OpenBookGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 46" className={className}>
      <path
        d="M5 6C25-4 40-4 50 4C60-4 75-4 95 6L95 40C75 30 60 30 50 38C40 30 25 30 5 40Z"
        stroke="#e8c15f"
        strokeWidth={1.1}
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M50 4V38" stroke="#e8c15f" strokeWidth={0.9} />
      <path
        d="M15 12h25M15 18h22M15 24h18M60 12h25M65 18h20M60 24h16"
        stroke="#e8c15f"
        strokeWidth={0.6}
        opacity={0.7}
      />
    </svg>
  );
}

export default function Hero({ onStart, onLeaderboard }: { onStart: () => void; onLeaderboard: () => void }) {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);

  // Subtle mouse parallax on desktop pointers only — a few px of drift,
  // never enough to distract or affect layout/readability.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const parallaxX = useSpring(rawX, { stiffness: 40, damping: 20 });
  const parallaxY = useSpring(rawY, { stiffness: 40, damping: 20 });
  const rayX = useTransform(parallaxX, (v) => v * 0.6);
  const rayY = useTransform(parallaxY, (v) => v * 0.6);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    function handleMove(e: MouseEvent) {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      rawX.set(relX * 16);
      rawY.set(relY * 12);
    }

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [rawX, rawY]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative overflow-hidden px-5 pt-16 pb-20 text-center sm:pt-24"
    >
      {/* cinematic scene backdrop */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        style={{ x: parallaxX, y: parallaxY }}
      >
        <motion.div
          className="absolute -top-40 -left-28 h-[440px] w-[440px] rounded-full bg-gold-500/25 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/4 -right-40 h-[480px] w-[480px] rounded-full bg-purple-500/20 blur-3xl"
          animate={{ scale: [1.05, 0.95, 1.05], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        {/* extra depth layer: soft center glow tying the two side blobs together */}
        <div
          className="absolute inset-x-0 top-10 h-[520px]"
          style={{
            background:
              "radial-gradient(45% 55% at 50% 30%, rgba(139,92,246,0.07) 0%, rgba(8,13,34,0) 70%)",
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-[70%]"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, rgba(232,193,95,0.08) 0%, rgba(8,13,34,0) 70%)",
          }}
        />

        {/* drifting fog / smoke banks low in the scene */}
        <motion.div
          className="absolute left-[-20%] top-[58%] h-32 w-[140%] rounded-[100%] bg-white/[0.035] blur-3xl"
          animate={{ x: ["-4%", "4%", "-4%"] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-[-25%] top-[72%] h-24 w-[130%] rounded-[100%] bg-purple-200/[0.03] blur-3xl"
          animate={{ x: ["3%", "-5%", "3%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* radiating light rays behind the headline */}
        <motion.svg
          viewBox="0 0 500 500"
          className="absolute left-1/2 top-[6%] h-[500px] w-[500px] -translate-x-1/2 opacity-[0.07]"
          style={{ x: rayX, y: rayY }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1="250"
              y1="120"
              x2={250 + Math.cos((i * Math.PI) / 6) * 260}
              y2={120 + Math.sin((i * Math.PI) / 6) * 260}
              stroke="#e8c15f"
              strokeWidth="1"
            />
          ))}
        </motion.svg>

        {/* giant faint glowing menorah watermark behind the title */}
        <svg
          viewBox="0 0 24 24"
          className="absolute left-1/2 top-[7%] h-[340px] w-[340px] -translate-x-1/2 opacity-[0.06] drop-shadow-[0_0_60px_rgba(232,193,95,0.4)]"
        >
          <path
            d="M12 2v9M12 11c-2.5 0-4-1.6-4-4M12 11c2.5 0 4-1.6 4-4M9 5c-1.6 0-3 .8-3 2.5M15 5c1.6 0 3 .8 3 2.5M12 11c-4 0-7 1.4-7 5v5h14v-5c0-3.6-3-5-7-5Z"
            stroke="#e8c15f"
            strokeWidth={0.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>

        {/* faint open Bible resting beneath the menorah, deep in the scene */}
        <OpenBookGlyph className="absolute left-1/2 top-[27%] h-[140px] w-[320px] -translate-x-1/2 opacity-[0.05]" />

        {/* floating particles drifting upward like embers */}
        {PARTICLES.map((p, i) => (
          <motion.span
            key={i}
            className="absolute bottom-0 rounded-full bg-gold-300/70"
            style={{ left: p.left, width: p.size, height: p.size }}
            animate={{
              y: ["0%", "-420%"],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* vignette for depth */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 20%, rgba(8,13,34,0) 40%, rgba(8,13,34,0.55) 100%)",
          }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-500"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse" />
        {t.hero.eyebrow}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative mx-auto mt-6 flex h-28 items-end justify-center"
      >
        {/* slow-rotating halo behind the menorah */}
        <motion.div
          aria-hidden
          className="absolute bottom-4 h-40 w-40 rounded-full opacity-70 blur-2xl"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(232,193,95,0.35), rgba(139,92,246,0.25), rgba(232,193,95,0.35))",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />

        {/* open Bible resting at the foot of the menorah */}
        <OpenBookGlyph className="absolute bottom-0 h-9 w-20 opacity-70 drop-shadow-[0_0_10px_rgba(232,193,95,0.35)]" />

        <div className="relative z-10 mb-5 animate-floatSlow">
          <svg viewBox="0 0 24 24" className="mx-auto h-16 w-16 drop-shadow-[0_0_18px_rgba(212,175,55,0.55)]">
            <path
              d="M12 2v9M12 11c-2.5 0-4-1.6-4-4M12 11c2.5 0 4-1.6 4-4M9 5c-1.6 0-3 .8-3 2.5M15 5c1.6 0 3 .8 3 2.5M12 11c-4 0-7 1.4-7 5v5h14v-5c0-3.6-3-5-7-5Z"
              stroke="#e8c15f"
              strokeWidth={1.1}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {[6, 9, 12, 15, 18].map((x, i) => (
              <circle key={i} cx={x} cy={x === 12 ? 4.6 : x === 9 || x === 15 ? 6.3 : 8} r="1" fill="#e8c15f" />
            ))}
          </svg>
        </div>
      </motion.div>

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
