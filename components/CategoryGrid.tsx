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
          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              whileHover={{ y: -6, scale: 1.015 }}
              onClick={() => onSelect(category.id)}
              className="group rounded-[20px] border border-gold-500/20 bg-white/[0.04] p-6 text-left shadow-[0_0_0_rgba(0,0,0,0)] transition-shadow hover:border-gold-500/55 hover:shadow-gold-lg"
            >
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(212,175,55,0.28) 0%, rgba(212,175,55,0.05) 100%)",
                }}
              >
                <CategoryIcon icon={category.icon} className="h-6 w-6" />
              </div>
              <div className="font-display text-xl font-semibold text-[#f7f0dc]">{text.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-[#9aa1b0]">{text.blurb}</p>
              <div className="mt-4 text-xs font-semibold tracking-wide text-gold-500">
                {availabilityText}
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
