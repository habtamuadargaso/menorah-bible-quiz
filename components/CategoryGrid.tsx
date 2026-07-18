"use client";

import { motion } from "framer-motion";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { completeLevelCount } from "@/lib/questions";
import { QUESTIONS_PER_LEVEL, MAX_GAME_LEVEL } from "@/lib/levels";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import CategoryIcon from "./CategoryIcon";

export default function CategoryGrid({ onSelect }: { onSelect: (categoryId: CategoryId) => void }) {
  const { t, lang } = useLanguage();
  const isAmharic = lang === "am";
  const readyLevels = completeLevelCount(lang);

  const availabilityText =
    lang === "am"
      ? `${readyLevels}/${MAX_GAME_LEVEL} ደረጃዎች ዝግጁ · በእያንዳንዱ ጨዋታ ${QUESTIONS_PER_LEVEL} ጥያቄዎች`
      : `${readyLevels}/${MAX_GAME_LEVEL} levels ready · ${QUESTIONS_PER_LEVEL} questions per game`;

  return (
    <section id="categories" className="mx-auto max-w-5xl px-5 pb-20 pt-4">
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
                  className={`absolute h-48 w-48 opacity-[0.14] transition-transform duration-500 group-hover:scale-110 ${
                    isPurple ? "text-purple-300" : "text-gold-400"
                  }`}
                >
                  <CategoryIcon icon={category.icon} className="h-full w-full" />
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
