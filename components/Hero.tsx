"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import heroArtwork from "@/public/images/menorah-hero.webp";

export default function Hero({ onStart, onLeaderboard }: { onStart: () => void; onLeaderboard: () => void }) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();

  return (
    <section id="hero" className="relative overflow-hidden pb-20 text-center">
      {/* the artwork: a large glowing Menorah standing on an illuminated open Bible */}
      <div className="relative h-[340px] w-full overflow-hidden sm:h-[440px] md:h-[540px]">
        <motion.div
          className="absolute inset-0"
          animate={reduceMotion ? undefined : { scale: [1, 1.045, 1] }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 14, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <Image
            src={heroArtwork}
            alt="A large glowing seven-branch Menorah standing on an illuminated open Bible, surrounded by warm golden light and a soft purple atmosphere"
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
        </motion.div>

        {/* slow gold glow breathing over the artwork */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 55% at 50% 35%, rgba(232,193,95,0.22) 0%, rgba(232,193,95,0) 70%)",
          }}
          animate={reduceMotion ? undefined : { opacity: [0.6, 1, 0.6] }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }
        />

        {/* dark purple gradient fade into the page background, for text readability below */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
          style={{
            background:
              "linear-gradient(to top, #080d22 0%, rgba(23,16,52,0.85) 35%, rgba(8,13,34,0) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 -mt-10 px-5 sm:-mt-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-500 backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse" />
          {t.hero.eyebrow}
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
      </div>
    </section>
  );
}
