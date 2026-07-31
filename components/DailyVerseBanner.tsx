"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getDailyVerse, getVerseText } from "@/lib/bible/verses";

const STAR_DOTS = [
  { top: "18%", left: "8%", delay: 0 },
  { top: "30%", left: "88%", delay: 0.8 },
  { top: "70%", left: "14%", delay: 1.6 },
  { top: "82%", left: "80%", delay: 0.4 },
  { top: "12%", left: "48%", delay: 1.2 },
  { top: "60%", left: "92%", delay: 2 },
];

// Hardcoded (rather than computed with Math.cos/Math.sin at render time) because
// server and client can round transcendental functions to different last bits,
// which React reports as a hydration mismatch once serialized to a JSX attribute
// string. Values are `200 + cos(i*PI/5)*220` / `sin(i*PI/5)*220`, rounded to 2dp.
const LIGHT_RAYS = [
  { x2: 420, y2: 0 },
  { x2: 377.98, y2: 129.31 },
  { x2: 267.98, y2: 209.23 },
  { x2: 132.02, y2: 209.23 },
  { x2: 22.02, y2: 129.31 },
  { x2: -20, y2: 0 },
  { x2: 22.02, y2: -129.31 },
  { x2: 132.02, y2: -209.23 },
  { x2: 267.98, y2: -209.23 },
  { x2: 377.98, y2: -129.31 },
];

export default function DailyVerseBanner({ onExplore }: { onExplore?: () => void }) {
  const { lang } = useLanguage();
  const verse = useMemo(() => getDailyVerse(), []);
  const text = getVerseText(verse, lang);
  const isAmharic = lang === "am";

  return (
    <section className="relative w-full overflow-hidden py-14 sm:py-20">
      {/* Illustrated artwork backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 100% at 50% 0%, rgba(139,92,246,0.16) 0%, rgba(8,13,34,0) 55%), radial-gradient(90% 90% at 50% 100%, rgba(232,193,95,0.12) 0%, rgba(8,13,34,0) 60%)",
          }}
        />

        {/* giant faint menorah watermark */}
        <svg
          viewBox="0 0 24 24"
          className="absolute -right-16 top-1/2 h-[420px] w-[420px] -translate-y-1/2 opacity-[0.05] sm:-right-10"
        >
          <path
            d="M12 2v9M12 11c-2.5 0-4-1.6-4-4M12 11c2.5 0 4-1.6 4-4M9 5c-1.6 0-3 .8-3 2.5M15 5c1.6 0 3 .8 3 2.5M12 11c-4 0-7 1.4-7 5v5h14v-5c0-3.6-3-5-7-5Z"
            stroke="#e8c15f"
            strokeWidth={0.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>

        {/* radiating light rays */}
        <svg viewBox="0 0 400 400" className="absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 opacity-[0.08]">
          {LIGHT_RAYS.map((ray, i) => (
            <line key={i} x1="200" y1="0" x2={ray.x2} y2={ray.y2} stroke="#e8c15f" strokeWidth="1" />
          ))}
        </svg>

        {STAR_DOTS.map((dot, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-gold-300"
            style={{ top: dot.top, left: dot.left }}
            animate={{ opacity: [0.15, 0.9, 0.15] }}
            transition={{
              duration: 3.4,
              delay: dot.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-4xl px-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[32px] border border-gold-500/25 bg-gradient-to-br from-white/[0.055] via-navy-900/75 to-navy-950/80 p-8 text-center shadow-premium-lg backdrop-blur-md sm:p-12"
        >
          <div className="relative">
            <div className="mx-auto inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.22em] text-gold-400">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500/25 bg-gold-500/10">
                <BookOpen className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              </span>
              {isAmharic ? "የዕለቱ ጥቅስ" : "Verse of the Day"}
            </div>

            <div className="mx-auto mt-5 h-px max-w-md bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

            <p className="mx-auto mt-7 max-w-2xl font-display text-2xl italic leading-relaxed text-[#f7f0dc] sm:text-3xl">
              <span className="text-gold-400">&ldquo;</span>
              {text}
              <span className="text-gold-400">&rdquo;</span>
            </p>

            <div className="mt-7 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold-400/60" />
              <span className="text-sm font-bold uppercase tracking-[0.16em] text-gold-400">
                {verse.reference}
              </span>
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold-400/60" />
            </div>

            {onExplore && (
              <button
                onClick={onExplore}
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold-500/40 px-6 py-2.5 text-sm font-semibold text-gold-400 outline-none transition-all hover:border-gold-400 hover:bg-gold-500/10 hover:shadow-[0_0_28px_rgba(232,193,95,0.35)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
              >
                {isAmharic ? "ተጨማሪ የመጽሐፍ ቅዱስ ገፅታዎችን ያስሱ" : "Explore Bible Features"}
                <span aria-hidden>→</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
