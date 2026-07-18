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
      // mountains, the tablets of the Law, and a distant ark on the water
      return (
        <svg viewBox="0 0 400 140" preserveAspectRatio="none" className={className}>
          <path d="M0 100 60 45 110 85 160 35 210 90 260 50 320 95 400 60" {...common} strokeWidth={1.2} />
          <path d="M172 118V78a14 14 0 0 1 28 0v40Z" {...common} strokeWidth={1.1} />
          <path d="M204 118V78a14 14 0 0 1 28 0v40Z" {...common} strokeWidth={1.1} />
          <path d="M180 90h12M180 100h12M212 90h12M212 100h12" {...common} strokeWidth={0.7} opacity={0.7} />
          <path d="M90 122q30-16 60 0" {...common} strokeWidth={0.9} />
          <path d="M120 122V102M112 102h16" {...common} strokeWidth={0.8} />
        </svg>
      );
    case "new-testament":
      // the cross, an unrolled scroll, and a fish
      return (
        <svg viewBox="0 0 400 140" preserveAspectRatio="none" className={className}>
          <path d="M200 15v100M170 45h60" {...common} strokeWidth={2.2} />
          <g>
            <circle cx="70" cy="100" r="8" {...common} strokeWidth={1} />
            <circle cx="140" cy="100" r="8" {...common} strokeWidth={1} />
            <path d="M78 100h54" {...common} strokeWidth={1} />
            <path d="M88 96h34M88 104h34" {...common} strokeWidth={0.6} opacity={0.7} />
          </g>
          <g>
            <path d="M290 95c8-10 30-10 40 0-10 10-32 10-40 0Z" {...common} strokeWidth={1} />
            <path d="M330 95l10-8M330 95l10 8" {...common} strokeWidth={1} />
          </g>
        </svg>
      );
    case "life-of-jesus":
      // the guiding star of Bethlehem with a soft trail, and an olive branch below
      return (
        <svg viewBox="0 0 400 140" preserveAspectRatio="none" className={className}>
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i * Math.PI) / 5;
            return (
              <line
                key={i}
                x1={200}
                y1={55}
                x2={200 + Math.cos(a) * 90}
                y2={55 + Math.sin(a) * 90}
                {...common}
                strokeWidth={1}
              />
            );
          })}
          <circle cx="200" cy="55" r="12" {...common} strokeWidth={1.3} />
          <path d="M215 65q30 20 60 45" {...common} strokeWidth={1} opacity={0.7} />
          <path d="M140 125q40-10 60 0M150 118q8-8 16 0M174 118q8-8 16 0" {...common} strokeWidth={0.9} />
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
      // an unrolled scroll, textured with lines of an ancient story
      return (
        <svg viewBox="0 0 400 140" preserveAspectRatio="none" className={className}>
          <circle cx="30" cy="70" r="14" {...common} strokeWidth={1} />
          <circle cx="370" cy="70" r="14" {...common} strokeWidth={1} />
          <path d="M30 70h340" {...common} strokeWidth={1} />
          {[30, 45, 60, 75, 90, 105].map((y) => (
            <line key={y} x1="55" y1={y} x2="345" y2={y} {...common} strokeWidth={0.6} opacity={0.55} />
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
      // praying hands beside a lit candle
      return (
        <svg viewBox="0 0 400 140" preserveAspectRatio="none" className={className}>
          <path d="M190 120V70c0-16 6-30 14-38 8 8 14 22 14 38v50" {...common} strokeWidth={1.1} />
          <path d="M190 120c-10 0-16-6-16-14M218 120c10 0 16-6 16-14" {...common} strokeWidth={1} />
          <path d="M300 118V86" {...common} strokeWidth={1} />
          <path d="M292 86h16" {...common} strokeWidth={0.8} />
          <path d="M300 60c-4 6-7 11-7 16a7 7 0 0 0 14 0c0-5-3-10-7-16Z" {...common} strokeWidth={0.9} />
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
                  className={`relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 ${
                    isPurple
                      ? "bg-gradient-to-br from-purple-400/30 to-purple-600/10 text-purple-200 group-hover:shadow-[0_0_28px_rgba(139,92,246,0.45)]"
                      : "bg-gradient-to-br from-gold-400/30 to-gold-600/10 text-gold-300 group-hover:shadow-[0_0_28px_rgba(232,193,95,0.45)]"
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
