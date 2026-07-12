"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { DIFFICULTIES, DIFFICULTY_CONFIG } from "@/lib/difficulty";
import type { Difficulty } from "@/lib/questions/types";
import type { CategoryId } from "@/lib/categories";

export default function DifficultySelect({
  categoryId,
  onSelect,
  onBack,
}: {
  categoryId: CategoryId;
  onSelect: (difficulty: Difficulty) => void;
  onBack: () => void;
}) {
  const { t } = useLanguage();
  const categoryText = t.categories[categoryId];

  return (
    <section className="mx-auto max-w-xl px-5 pb-24 pt-4 text-center">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gold-500">{categoryText?.title}</div>
      <h2 className="font-display text-3xl font-bold text-[#fbf6e8]">{t.difficultySection.heading}</h2>
      <p className="mt-2 text-sm text-[#a7aebd]">{t.difficultySection.subheading}</p>

      <div className="mt-8 flex flex-col gap-3">
        {DIFFICULTIES.map((d, i) => (
          <motion.button
            key={d}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            whileHover={{ y: -3 }}
            onClick={() => onSelect(d)}
            className="flex items-center justify-between rounded-2xl border border-gold-500/25 bg-white/[0.04] px-6 py-4 text-left transition-colors hover:border-gold-500/55 hover:bg-white/[0.06]"
          >
            <span className="font-display text-lg font-semibold text-[#f3efe2]">{t.quiz.difficulty[d]}</span>
            <span className="text-xs font-semibold text-gold-500">
              +{DIFFICULTY_CONFIG[d].xpPerCorrect} {t.common.xp} · {DIFFICULTY_CONFIG[d].timePerQuestion}s
            </span>
          </motion.button>
        ))}
      </div>

      <button onClick={onBack} className="mt-8 text-sm font-semibold text-[#c6cbd6] hover:text-gold-500">
        {t.quiz.backToCategories}
      </button>
    </section>
  );
}
