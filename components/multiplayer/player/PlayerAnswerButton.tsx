"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const LETTERS = ["A", "B", "C", "D"];

const PlayerAnswerButton = memo(function PlayerAnswerButton({
  index,
  text,
  isSelected,
  isLocked,
  onSelect,
}: {
  index: number;
  text: string;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: (index: number) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(index)}
      disabled={isLocked}
      aria-pressed={isSelected}
      whileHover={reduceMotion || isLocked ? undefined : { scale: 1.02 }}
      whileTap={reduceMotion || isLocked ? undefined : { scale: 0.97 }}
      className={`flex min-h-[72px] w-full items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${
        isSelected
          ? "border-gold-500 bg-gold-500/15 shadow-[0_0_24px_rgba(232,193,95,0.35)]"
          : "border-white/12 bg-white/[0.05]"
      } ${isLocked && !isSelected ? "opacity-50" : ""} ${isLocked ? "cursor-not-allowed" : "cursor-pointer active:opacity-90"}`}
    >
      <span
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border font-display text-sm font-bold ${
          isSelected ? "border-gold-400 bg-gold-500/25 text-gold-200" : "border-purple-400/40 bg-purple-500/15 text-purple-200"
        }`}
        aria-hidden
      >
        {LETTERS[index]}
      </span>
      <span className="font-display text-base font-semibold leading-snug text-[#f3efe2] sm:text-lg">{text}</span>
    </motion.button>
  );
});

export default PlayerAnswerButton;
