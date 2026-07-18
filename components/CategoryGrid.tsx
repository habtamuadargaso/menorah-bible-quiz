"use client";

import { motion } from "framer-motion";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { completeLevelCount } from "@/lib/questions";
import { QUESTIONS_PER_LEVEL, MAX_GAME_LEVEL } from "@/lib/levels";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import CategoryIcon from "./CategoryIcon";

export default function CategoryGrid({ onSelect }: { onSelect: (categoryId: CategoryId) => void }) {
  const { t, lang } = useLanguage();
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

          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              whileHover={{ y: -8, scale: 1.015 }}
              onClick={() => onSelect(category.id)}
              className={`group relative overflow-hidden rounded-[28px] border text-left shadow-[0_20px_60px_rgba(0,0,0,.3)] backdrop-blur-md transition-colors ${
                isPurple
                  ? "border-purple-400/25 bg-white/[0.03] hover:border-purple-400/55 hover:shadow-purple-lg"
                  : "border-gold-500/25 bg-white/[0.03] hover:border-gold-500/55 hover:shadow-gold-lg"
              }`}
            >
              {/* illustrated art zone */}
              <div
                className={`relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br ${
                  isPurple
                    ? "from-purple-500/20 via-purple-400/5 to-transparent"
                    : "from-gold-500/20 via-gold-400/5 to-transparent"
                }`}
              >
                <div
                  aria-hidden
                  className={`absolute h-44 w-44 opacity-[0.14] transition-transform duration-500 group-hover:scale-110 ${
                    isPurple ? "text-purple-300" : "text-gold-400"
                  }`}
                >
                  <CategoryIcon icon={category.icon} className="h-full w-full" />
                </div>

                <div
                  className={`relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                    isPurple
                      ? "bg-gradient-to-br from-purple-400/30 to-purple-600/10 text-purple-200"
                      : "bg-gradient-to-br from-gold-400/30 to-gold-600/10 text-gold-300"
                  }`}
                >
                  <CategoryIcon icon={category.icon} className="h-7 w-7" />
                </div>
              </div>

              <div className="p-6">
                <div className="font-display text-xl font-semibold text-[#f7f0dc]">{text.title}</div>
                <p className="mt-1 text-sm leading-relaxed text-[#9aa1b0]">{text.blurb}</p>

                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold tracking-wide ${
                      isPurple ? "text-purple-300" : "text-gold-500"
                    }`}
                  >
                    {availabilityText}
                  </span>
                  <span
                    className={`text-sm font-bold opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 ${
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
