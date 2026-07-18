"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
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

export default function DailyVerseBanner() {
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
          {Array.from({ length: 10 }).map((_, i) => (
            <line
              key={i}
              x1="200"
              y1="0"
              x2={200 + Math.cos((i * Math.PI) / 5) * 220}
              y2={Math.sin((i * Math.PI) / 5) * 220}
              stroke="#e8c15f"
              strokeWidth="1"
            />
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
          className="relative overflow-hidden rounded-[32px] border border-purple-400/25 bg-gradient-to-br from-purple-500/15 via-white/[0.05] to-gold-500/10 p-8 text-center shadow-[0_28px_90px_rgba(0,0,0,.4)] backdrop-blur-md sm:p-12"
        >
          {/* slow shine sweep */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            style={{ mixBlendMode: "screen" }}
            animate={{ x: ["-120%", "320%"] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              repeatDelay: 4.5,
              ease: "easeInOut",
            }}
          />

          <div className="relative">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-gold-400">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse" />
              {isAmharic ? "የዕለቱ ጥቅስ" : "Verse of the Day"}
            </div>

            <p className="mx-auto mt-6 max-w-2xl font-display text-2xl italic leading-relaxed text-[#f7f0dc] sm:text-3xl">
              <span className="text-gold-400">&ldquo;</span>
              {text}
              <span className="text-gold-400">&rdquo;</span>
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-purple-300/60" />
              <span className="text-sm font-semibold uppercase tracking-[0.14em] text-purple-300">
                {verse.reference}
              </span>
              <span className="h-px w-8 bg-gradient-to-l from-transparent to-purple-300/60" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
