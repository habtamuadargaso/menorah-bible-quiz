"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { UIStrings } from "@/lib/i18n/types";
import type { AnswerRow, RoomPlayerState, RoomQuestionView } from "@/lib/liveBattleRoom";

const CHOICE_LETTERS = ["A", "B", "C", "D"];

export default function HostRoundReveal({
  t,
  question,
  answers,
  players,
  onContinue,
}: {
  t: UIStrings;
  question: RoomQuestionView;
  answers: AnswerRow[];
  players: RoomPlayerState[];
  onContinue: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const th = t.multiplayerHost;
  const nameFor = (playerId: string) => players.find((p) => p.playerId === playerId)?.displayName ?? "?";

  const distribution = [0, 1, 2, 3].map((index) => answers.filter((a) => a.selectedAnswer === index).length);
  const maxCount = Math.max(1, ...distribution);
  const fastestCorrect = answers
    .filter((a) => a.isCorrect)
    .sort((a, b) => a.responseTimeMs - b.responseTimeMs)[0];

  return (
    <main
      className="min-h-screen w-full px-6 py-10 text-[#f3efe2] lg:px-16"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
          className="rounded-card border border-emerald-400/30 bg-emerald-500/10 p-6 text-center shadow-premium lg:p-8"
        >
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">{th.revealHeading}</p>
          <h1 className="mt-2 font-display text-xl font-bold text-[#fbf6e8] lg:text-3xl">
            {question.correctIndex !== null ? question.choices[question.correctIndex] : "—"}
          </h1>
        </motion.div>

        <div className="rounded-card border border-white/10 bg-white/[0.04] p-6 shadow-premium lg:p-8">
          <h2 className="mb-4 font-display text-base font-bold text-[#fbf6e8]">{th.distributionHeading}</h2>
          <div className="flex flex-col gap-3">
            {question.choices.map((choice, index) => (
              <div key={index} className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                    index === question.correctIndex
                      ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300"
                      : "border-white/15 bg-white/[0.03] text-[#9aa1b0]"
                  }`}
                >
                  {CHOICE_LETTERS[index]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs text-[#c6cbd6]">
                    <span className="truncate">{choice}</span>
                    <span className="flex-shrink-0 font-bold">{distribution[index]}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(distribution[index] / maxCount) * 100}%` }}
                      transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${index === question.correctIndex ? "bg-emerald-400" : "bg-purple-400/60"}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-card border border-gold-500/25 bg-glass-gold p-5 text-center shadow-premium">
          <p className="text-xs font-bold uppercase tracking-wide text-gold-400">{th.fastestCorrectLabel}</p>
          <p className="mt-1 font-display text-lg font-bold text-[#fbf6e8]">
            {fastestCorrect ? `${nameFor(fastestCorrect.playerId)} — ${(fastestCorrect.responseTimeMs / 1000).toFixed(1)}${t.battleShared.secondsShort}` : th.noOneAnsweredCorrectly}
          </p>
        </div>

        <motion.button
          type="button"
          onClick={onContinue}
          whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="mx-auto rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-8 py-3.5 text-sm font-bold text-navy-900 shadow-gold outline-none transition-shadow hover:shadow-[0_0_36px_rgba(232,193,95,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          {th.continueButton}
        </motion.button>
      </div>
    </main>
  );
}
