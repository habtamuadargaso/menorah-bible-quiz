"use client";

import { motion } from "framer-motion";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { completeLevelCount } from "@/lib/questions";
import { QUESTIONS_PER_LEVEL, MAX_GAME_LEVEL } from "@/lib/levels";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import CategoryIcon from "./CategoryIcon";
import SectionBackdrop from "./SectionBackdrop";

// Elegant, Bible-themed line-art motifs — one per category — so each
// adventure card reads as a distinct place, not just a recolored icon.
function CategoryMotif({ id, className }: { id: CategoryId; className?: string }) {
  const common = { stroke: "currentColor", fill: "none" as const, strokeLinecap: "round" as const };

  switch (id) {
    case "old-testament":
      // desert dunes under a distant sun
      return (
        <svg viewBox="0 0 400 140" preserveAspectRatio="none" className={className}>
          <circle cx="330" cy="40" r="22" {...common} strokeWidth={1} />
          <path d="M0 110c60-30 100-30 140 0s100 30 140 0 100-30 120-10" {...common} strokeWidth={1.2} />
          <path d="M0 130c60-24 100-24 140 0s100 24 140 0 100-24 120-8" {...common} strokeWidth={1} />
        </svg>
      );
    case "new-testament":
      // sunrise rays over a horizon
      return (
        <svg viewBox="0 0 400 140" preserveAspectRatio="none" className={className}>
          <path d="M200 90V10M140 95 100 30M260 95l40-65M90 110 30 70M310 110l60-40" {...common} strokeWidth={1.2} />
          <path d="M0 112h400" {...common} strokeWidth={1} />
        </svg>
      );
    case "life-of-jesus":
      // radiant starburst
      return (
        <svg viewBox="0 0 400 140" preserveAspectRatio="none" className={className}>
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i * Math.PI) / 5;
            return (
              <line
                key={i}
                x1={200}
                y1={70}
                x2={200 + Math.cos(a) * 110}
                y2={70 + Math.sin(a) * 110}
                {...common}
                strokeWidth={1}
              />
            );
          })}
          <circle cx="200" cy="70" r="14" {...common} strokeWidth={1.3} />
        </svg>
      );
    case "apostles":
      // fishing net over gentle waves
      return (
        <svg viewBox="0 0 400 140" preserveAspectRatio="none" className={className}>
          {[20, 60, 100, 140].map((y) => (
            <path key={`h${y}`} d={`M0 ${y}q50 20 100 0t100 0 100 0 100 0`} {...common} strokeWidth={0.8} />
          ))}
          {[40, 120, 200, 280, 360].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="140" {...common} strokeWidth={0.8} />
          ))}
        </svg>
      );
    case "bible-characters":
      // scattered starfield
      return (
        <svg viewBox="0 0 400 140" className={className}>
          {[
            [30, 30, 2.4], [80, 70, 1.6], [130, 25, 2], [180, 90, 1.8], [230, 40, 2.6],
            [270, 100, 1.6], [320, 30, 2.2], [360, 75, 1.8], [50, 110, 1.6], [300, 60, 2],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />
          ))}
        </svg>
      );
    case "youth-challenge":
      // dynamic energy chevrons
      return (
        <svg viewBox="0 0 400 140" preserveAspectRatio="none" className={className}>
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${-20 + i * 130} 140 100 20 ${220 + i * 130} 140`} {...common} strokeWidth={1.4} />
          ))}
        </svg>
      );
    case "psalms-proverbs":
      // harp / lyre strings
      return (
        <svg viewBox="0 0 400 140" preserveAspectRatio="none" className={className}>
          <path d="M60 130C40 80 60 20 120 10" {...common} strokeWidth={1.4} />
          <path d="M340 130C360 80 340 20 280 10" {...common} strokeWidth={1.4} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <line key={i} x1={122 + i * 24} y1="14" x2={112 + i * 24} y2="128" {...common} strokeWidth={0.9} />
          ))}
        </svg>
      );
    case "faith-prayer":
      // soft clouds with gentle light
      return (
        <svg viewBox="0 0 400 140" preserveAspectRatio="none" className={className}>
          <path
            d="M90 90a26 26 0 0 1 0-52 34 34 0 0 1 66-14 28 28 0 0 1 34 40 24 24 0 0 1-4 26Z"
            {...common}
            strokeWidth={1.1}
          />
          <path
            d="M230 110a20 20 0 0 1 2-40 26 26 0 0 1 50-8 22 22 0 0 1 24 32Z"
            {...common}
            strokeWidth={1}
          />
        </svg>
      );
    case "gospel-challenge":
      // layered flame
      return (
        <svg viewBox="0 0 400 140" preserveAspectRatio="none" className={className}>
          <path
            d="M200 20c26 30 40 52 40 76a40 40 0 0 1-80 0c0-10 3-18 8-24 2 10 8 14 13 14-5-24 5-42 19-66Z"
            {...common}
            strokeWidth={1.2}
          />
          <path
            d="M200 50c14 18 22 32 22 46a22 22 0 0 1-44 0c0-14 8-28 22-46Z"
            {...common}
            strokeWidth={0.9}
          />
        </svg>
      );
    case "hard-questions":
    default:
      // a quiet constellation of question marks
      return (
        <svg viewBox="0 0 400 140" preserveAspectRatio="none" className={className}>
          {[
            [60, 60], [180, 40], [300, 70], [140, 100], [340, 30],
          ].map(([cx, cy], i) => (
            <g key={i} transform={`translate(${cx} ${cy})`}>
              <path d="M-6-4a7 7 0 1 1 9 6c-3 1.5-4 3-4 6" {...common} strokeWidth={1.1} />
              <circle cy="16" r="0.8" fill="currentColor" stroke="none" />
            </g>
          ))}
        </svg>
      );
  }
}

export default function CategoryGrid({ onSelect }: { onSelect: (categoryId: CategoryId) => void }) {
  const { t, lang } = useLanguage();
  const isAmharic = lang === "am";
  const readyLevels = completeLevelCount(lang);

  const availabilityText =
    lang === "am"
      ? `${readyLevels}/${MAX_GAME_LEVEL} ደረጃዎች ዝግጁ · በእያንዳንዱ ጨዋታ ${QUESTIONS_PER_LEVEL} ጥያቄዎች`
      : `${readyLevels}/${MAX_GAME_LEVEL} levels ready · ${QUESTIONS_PER_LEVEL} questions per game`;

  return (
    <section id="categories" className="relative mx-auto max-w-5xl px-5 pb-20 pt-10">
      <SectionBackdrop tint="purple" />
      <div className="mb-10 text-center">
        <h2 className="font-display text-3xl font-bold text-[#fbf6e8] sm:text-4xl">
          {t.categoriesSection.heading}
        </h2>
        <p className="mt-2 text-[15px] text-[#a7aebd]">{t.categoriesSection.subheading}</p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gold-400">
          {availabilityText}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((category, index) => {
          const text = t.categories[category.id];
          const isPurple = index % 2 === 1;
          const adventureNumber = String(index + 1).padStart(2, "0");

          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => onSelect(category.id)}
              className={`group relative overflow-hidden rounded-card border text-left shadow-premium outline-none backdrop-blur-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${
                isPurple
                  ? "border-purple-400/25 bg-white/[0.03] hover:border-purple-400/55 hover:shadow-purple-lg focus-visible:ring-purple-300"
                  : "border-gold-500/25 bg-white/[0.03] hover:border-gold-500/55 hover:shadow-gold-lg focus-visible:ring-gold-300"
              }`}
            >
              {/* illustrated art zone — image-ready: drop a <Image fill> as the first child and this gradient/icon layer becomes its legibility scrim */}
              <div
                className={`relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br ${
                  isPurple
                    ? "from-purple-500/25 via-purple-400/5 to-transparent"
                    : "from-gold-500/25 via-gold-400/5 to-transparent"
                }`}
              >
                <div
                  aria-hidden
                  className={`absolute inset-0 opacity-[0.22] transition-transform duration-500 group-hover:scale-105 ${
                    isPurple ? "text-purple-300" : "text-gold-400"
                  }`}
                >
                  <CategoryMotif id={category.id} className="h-full w-full" />
                </div>

                <span
                  className={`absolute left-4 top-4 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                    isPurple
                      ? "border-purple-300/30 bg-navy-950/50 text-purple-200"
                      : "border-gold-400/30 bg-navy-950/50 text-gold-300"
                  }`}
                >
                  {isAmharic ? `ጀብዱ ${adventureNumber}` : `Adventure ${adventureNumber}`}
                </span>

                <div
                  className={`relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                    isPurple
                      ? "bg-gradient-to-br from-purple-400/30 to-purple-600/10 text-purple-200"
                      : "bg-gradient-to-br from-gold-400/30 to-gold-600/10 text-gold-300"
                  }`}
                >
                  <CategoryIcon icon={category.icon} className="h-8 w-8" />
                </div>
              </div>

              <div className="p-6">
                <div className="font-display text-xl font-semibold text-[#f7f0dc]">{text.title}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-[#9aa1b0]">{text.blurb}</p>

                <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                  <span
                    className={`text-xs font-semibold tracking-wide ${
                      isPurple ? "text-purple-300" : "text-gold-500"
                    }`}
                  >
                    {isAmharic ? "ጀብዱ ጀምር" : "Begin Adventure"}
                  </span>
                  <span
                    className={`text-sm font-bold transition-transform duration-300 group-hover:translate-x-1 ${
                      isPurple ? "text-purple-300" : "text-gold-400"
                    }`}
                  >
                    →
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
