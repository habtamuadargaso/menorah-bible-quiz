"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { UIStrings } from "@/lib/i18n/types";
import type { AnswerRow, RoomPlayerState } from "@/lib/liveBattleRoom";

export default function PlayerFinalResult({
  t,
  players,
  myPlayerId,
  myAnswers,
  onPlayAgain,
  onLeave,
}: {
  t: UIStrings;
  players: RoomPlayerState[];
  myPlayerId: string;
  myAnswers: AnswerRow[];
  onPlayAgain: () => void;
  onLeave: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const tp = t.multiplayerPlayer;
  const tb = t.battleShared;

  const ranked = [...players].sort((a, b) => b.score - a.score);
  const myRank = ranked.findIndex((p) => p.playerId === myPlayerId) + 1;
  const me = players.find((p) => p.playerId === myPlayerId);
  const correctCount = myAnswers.filter((a) => a.isCorrect).length;
  const accuracyPct = myAnswers.length > 0 ? Math.round((correctCount / myAnswers.length) * 100) : 0;
  const avgResponseMs =
    myAnswers.length > 0 ? myAnswers.reduce((sum, a) => sum + a.responseTimeMs, 0) / myAnswers.length : 0;
  const isChampion = myRank === 1;

  return (
    <main
      className="min-h-screen w-full px-4 py-8 text-[#f3efe2]"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto flex max-w-md flex-col gap-5 text-center">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.5, ease: "backOut" }}
        >
          <span className="text-5xl" aria-hidden>
            {isChampion ? "🏆" : "🎖️"}
          </span>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-gold-500">{tp.finalRankLabel}</p>
          <h1 className="mt-1 font-display text-4xl font-bold text-[#fbf6e8]">#{myRank || players.length}</h1>
        </motion.div>

        <div className="rounded-card border border-gold-500/25 bg-glass-gold p-5 shadow-premium">
          <div className="text-[11px] uppercase tracking-wide text-gold-400">{tp.finalScoreLabel}</div>
          <div className="mt-1 font-display text-3xl font-bold text-gold-300">{me?.score ?? 0}</div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-4">
            <div className="text-[10px] uppercase tracking-wide text-[#9aa1b0]">{tp.finalAccuracyLabel}</div>
            <div className="mt-1 font-display text-lg font-bold text-[#f3efe2]">{accuracyPct}%</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-4">
            <div className="text-[10px] uppercase tracking-wide text-[#9aa1b0]">{tp.finalCorrectAnswersLabel}</div>
            <div className="mt-1 font-display text-lg font-bold text-[#f3efe2]">
              {correctCount}/{myAnswers.length}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-4">
            <div className="text-[10px] uppercase tracking-wide text-[#9aa1b0]">{tp.finalAvgResponseTimeLabel}</div>
            <div className="mt-1 font-display text-lg font-bold text-[#f3efe2]">{(avgResponseMs / 1000).toFixed(1)}{tb.secondsShort}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <motion.button
            type="button"
            onClick={onPlayAgain}
            whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className="rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-6 py-3.5 text-sm font-bold text-navy-900 shadow-gold outline-none transition-shadow hover:shadow-[0_0_36px_rgba(232,193,95,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {tp.playAgainButton}
          </motion.button>
          <button
            type="button"
            onClick={onLeave}
            className="rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-[#c6cbd6] outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {tp.leaveButton}
          </button>
        </div>
      </div>
    </main>
  );
}
