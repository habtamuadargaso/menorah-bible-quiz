"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Hero({ onStart, onLeaderboard }: { onStart: () => void; onLeaderboard: () => void }) {
  const { t } = useLanguage();

  return (
    <section
      id="hero"
      className="relative overflow-hidden px-5 pt-16 pb-20 text-center sm:pt-24"
    >
      {/* cinematic ambient lighting */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
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
        <div
          className="absolute inset-x-0 top-0 h-[70%]"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, rgba(232,193,95,0.08) 0%, rgba(8,13,34,0) 70%)",
          }}
        />
        {/* vignette for depth */}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative mx-auto mt-6 flex h-24 items-center justify-center"
      >
        {/* slow-rotating halo behind the menorah */}
        <motion.div
          aria-hidden
          className="absolute h-40 w-40 rounded-full opacity-70 blur-2xl"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(232,193,95,0.35), rgba(139,92,246,0.25), rgba(232,193,95,0.35))",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative animate-floatSlow">
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
        className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight text-[#fbf6e8] sm:text-5xl md:text-6xl"
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
        <button
          onClick={onStart}
          className="rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-9 py-3.5 text-[15px] font-bold text-navy-900 shadow-gold outline-none transition-transform hover:-translate-y-0.5 hover:shadow-[0_0_42px_rgba(212,175,55,0.65)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          {t.hero.startButton}
        </button>
        <button
          onClick={onLeaderboard}
          className="rounded-full border border-gold-500/50 px-7 py-3.5 text-[15px] font-semibold text-gold-500 outline-none transition-colors hover:bg-gold-500/10 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          {t.hero.leaderboardButton}
        </button>
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
