"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { UIStrings } from "@/lib/i18n/types";
import type { AnswerRow, RoomPlayerState, RoomQuestionView } from "@/lib/liveBattleRoom";

export default function PlayerRoundResult({
  t,
  question,
  myAnswer,
  players,
  myPlayerId,
}: {
  t: UIStrings;
  question: RoomQuestionView;
  myAnswer: AnswerRow | null;
  players: RoomPlayerState[];
  myPlayerId: string;
}) {
  const reduceMotion = useReducedMotion();
  const tp = t.multiplayerPlayer;
  const tb = t.battleShared;

  const ranked = [...players].sort((a, b) => b.score - a.score);
  const myRank = ranked.findIndex((p) => p.playerId === myPlayerId) + 1;
  const isCorrect = Boolean(myAnswer?.isCorrect);

  return (
    <main
      className="min-h-screen w-full px-4 py-8 text-[#f3efe2]"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <motion.div
          role="status"
          aria-live="polite"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.35, ease: "backOut" }}
          className={`rounded-card border p-6 text-center shadow-premium ${
            isCorrect ? "border-emerald-400/40 bg-emerald-500/10" : "border-red-400/40 bg-red-500/10"
          }`}
        >
          <span className="text-4xl" aria-hidden>
            {isCorrect ? "✅" : "❌"}
          </span>
          <h1 className={`mt-2 font-display text-2xl font-bold ${isCorrect ? "text-emerald-300" : "text-red-300"}`}>
            {isCorrect ? tp.correctMessage : tp.incorrectMessage}
          </h1>
          {!isCorrect && question.correctIndex !== null && (
            <p className="mt-2 text-sm text-[#c6cbd6]">
              {tp.correctAnswerWasLabel} <span className="font-semibold text-[#f3efe2]">{question.choices[question.correctIndex]}</span>
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-center">
            <div className="text-[10px] uppercase tracking-wide text-[#9aa1b0]">{tp.pointsEarnedLabel}</div>
            <div className="mt-1 font-display text-xl font-bold text-gold-300">+{myAnswer?.pointsAwarded ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-center">
            <div className="text-[10px] uppercase tracking-wide text-[#9aa1b0]">{tp.responseTimeLabel}</div>
            <div className="mt-1 font-display text-xl font-bold text-[#f3efe2]">
              {myAnswer ? `${(myAnswer.responseTimeMs / 1000).toFixed(1)}${tb.secondsShort}` : "—"}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gold-500/25 bg-glass-gold px-4 py-4 text-center">
          <div className="text-[10px] uppercase tracking-wide text-gold-400">{tp.currentRankHeading}</div>
          <div className="mt-1 font-display text-2xl font-bold text-gold-300">
            {tp.currentRankLabel.replace("{rank}", String(myRank || players.length)).replace("{total}", String(players.length))}
          </div>
        </div>

        <p className="text-center text-sm text-[#a7aebd]">{tp.waitingForNextMessage}</p>
      </div>
    </main>
  );
}
