"use client";

import { memo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type AnswerState = "idle" | "correct" | "wrong" | "muted";

const AnswerButton = memo(function AnswerButton({
  label,
  optionLetter,
  state,
  disabled,
  onSelect,
}: {
  label: string;
  optionLetter: string;
  state: AnswerState;
  disabled: boolean;
  onSelect: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const shake = state === "wrong" && !reduceMotion;

  const stateClasses: Record<AnswerState, string> = {
    idle: "border-white/15 bg-white/[0.04] text-[#f3efe2] hover:border-gold-500/50 hover:bg-white/[0.07]",
    correct: "border-emerald-400/70 bg-emerald-500/15 text-[#f3efe2] shadow-[0_0_24px_rgba(52,211,153,0.35)]",
    wrong: "border-red-400/70 bg-red-500/15 text-[#f3efe2]",
    muted: "border-white/10 bg-white/[0.02] text-[#7c8394]",
  };

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={state === "correct" || state === "wrong"}
      whileHover={disabled || reduceMotion ? undefined : { y: -2, scale: 1.015 }}
      whileTap={disabled || reduceMotion ? undefined : { scale: 0.98 }}
      animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={shake ? { duration: 0.4, ease: "easeInOut" } : { duration: 0.2, ease: "easeOut" }}
      className={`relative flex min-h-[60px] items-center gap-3 rounded-2xl border px-5 py-4 text-left text-[15px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:cursor-not-allowed ${stateClasses[state]}`}
    >
      <span
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
          state === "correct" ? "border-emerald-400/60 text-emerald-300" : state === "wrong" ? "border-red-400/60 text-red-300" : "border-white/20 text-[#9aa1b0]"
        }`}
      >
        {optionLetter}
      </span>
      <span>{label}</span>
      {state === "correct" && (
        <span className="ml-auto text-emerald-300" aria-hidden>
          ✓
        </span>
      )}
      {state === "wrong" && (
        <span className="ml-auto text-red-300" aria-hidden>
          ✕
        </span>
      )}
    </motion.button>
  );
});

export default function BattleQuestion({
  reference,
  questionText,
  choices,
  correctIndex,
  explanation,
  selected,
  revealing,
  onSelect,
  chooseAnswerLabel,
  answerLockedLabel,
  correctAnswerLabel,
  roundResultsLabel,
  roundResult,
  streakLabel,
  pointsShort,
}: {
  reference: string;
  questionText: string;
  choices: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  selected: number | null;
  revealing: boolean;
  onSelect: (index: number) => void;
  chooseAnswerLabel: string;
  answerLockedLabel: string;
  correctAnswerLabel: string;
  roundResultsLabel: string;
  roundResult: { correct: boolean; pointsAwarded: number; streak: number } | null;
  streakLabel: string;
  pointsShort: string;
}) {
  const reduceMotion = useReducedMotion();
  const optionLetters = ["A", "B", "C", "D"];

  return (
    <motion.div
      key={questionText}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-card border border-gold-500/20 bg-glass-gold p-6 shadow-premium-lg backdrop-blur-md sm:p-9"
    >
      <p className="mb-1.5 flex items-center gap-2 text-sm font-bold text-gold-500">
        <span aria-hidden>📖</span>
        {reference}
      </p>
      <h2 className="mb-7 font-display text-xl font-bold leading-snug text-[#fbf6e8] sm:text-2xl md:text-[26px]">
        {questionText}
      </h2>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {choices.map((choice, index) => {
          let state: AnswerState = "idle";
          if (revealing) {
            if (index === correctIndex) state = "correct";
            else if (index === selected) state = "wrong";
            else state = "muted";
          } else if (selected !== null) {
            state = index === selected ? "idle" : "muted";
          }
          return (
            <AnswerButton
              key={`${questionText}-${index}`}
              label={choice}
              optionLetter={optionLetters[index]}
              state={state}
              disabled={selected !== null || revealing}
              onSelect={() => onSelect(index)}
            />
          );
        })}
      </div>

      <div className="relative mt-4 min-h-[1px]">
        <AnimatePresence>
          {selected !== null && !revealing && (
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-center text-sm text-[#c6cbd6]"
            >
              {answerLockedLabel}
            </motion.div>
          )}
          {selected === null && !revealing && (
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-center text-sm text-[#c6cbd6]">
              {chooseAnswerLabel}
            </div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {revealing && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.3 }}
            className="mt-5 overflow-hidden"
          >
            <div className="rounded-2xl border border-gold-500/25 bg-navy-900/60 p-5 shadow-premium">
              <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gold-500">{roundResultsLabel}</div>
              <p className="font-bold text-emerald-300">
                {correctAnswerLabel} {choices[correctIndex]}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#c6cbd6]">{explanation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealing && roundResult && roundResult.correct && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.4, ease: "backOut" }}
            className="absolute right-5 top-5 flex items-center gap-2 rounded-full border border-gold-400/40 bg-navy-950/90 px-4 py-1.5 text-sm font-bold shadow-gold"
          >
            <span className="text-gold-300">
              +{roundResult.pointsAwarded} {pointsShort}
            </span>
            {roundResult.streak >= 2 && (
              <span className="text-purple-200">
                🔥 {roundResult.streak} {streakLabel}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
