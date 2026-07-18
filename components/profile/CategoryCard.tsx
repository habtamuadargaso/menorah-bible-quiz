"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import CategoryIcon from "@/components/CategoryIcon";
import type { IconName } from "@/lib/categories";

// One card in the Favorite Categories grid — ranked by how many times the
// player has played that category.
const CategoryCard = memo(function CategoryCard({
  icon,
  title,
  playsLabel,
  rank,
  delay = 0,
}: {
  icon: IconName;
  title: string;
  playsLabel: string;
  rank: number;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  const isTop = rank === 1;
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0.2, delay } : { duration: 0.4, delay, ease: "easeOut" }}
      whileHover={reduceMotion ? undefined : { y: -4, scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl border p-4 text-left shadow-premium transition-colors ${
        isTop ? "border-gold-500/40 bg-glass-gold" : "border-white/10 bg-white/[0.04] hover:border-purple-400/30"
      }`}
    >
      {isTop && (
        <span className="absolute right-3 top-3 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-navy-900">
          #1
        </span>
      )}
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.03) 100%)" }}
      >
        <CategoryIcon icon={icon} className="h-5 w-5" />
      </div>
      <div className="font-display text-sm font-bold text-[#f3efe2]">{title}</div>
      <div className="mt-1 text-[11px] text-[#9aa1b0]">{playsLabel}</div>
    </motion.div>
  );
});

export default CategoryCard;
