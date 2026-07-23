"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { UIStrings } from "@/lib/i18n/types";
import type { RoomPlayerState } from "@/lib/liveBattleRoom";
import BattleLeaderboard, { type BattleLeaderboardEntry } from "@/components/battle/BattleLeaderboard";

export default function HostLeaderboard({
  t,
  players,
  questionNumber,
  questionCount,
  onContinue,
  isHost = true,
}: {
  t: UIStrings;
  players: RoomPlayerState[];
  questionNumber: number;
  questionCount: number;
  onContinue?: () => void;
  isHost?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const th = t.multiplayerHost;
  const isFinalQuestion = questionNumber >= questionCount;

  const entries: BattleLeaderboardEntry[] = [...players]
    .sort((a, b) => b.score - a.score)
    .map((p) => ({ id: p.id, name: p.displayName, score: p.score, isYou: false }));

  return (
    <main
      className="min-h-screen w-full px-6 py-10 text-[#f3efe2] lg:px-16"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <motion.header
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
          className="text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-500">
            {th.questionCountLabel} {questionNumber}/{questionCount}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-[#fbf6e8]">{th.topPlayersHeading}</h1>
        </motion.header>

        <div className="rounded-card border border-white/10 bg-white/[0.04] p-6 shadow-premium lg:p-8">
          <BattleLeaderboard heading={th.topPlayersHeading} entries={entries} />
        </div>

        {isHost ? (
          <motion.button
            type="button"
            onClick={onContinue}
            whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className="mx-auto rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-8 py-3.5 text-sm font-bold text-navy-900 shadow-gold outline-none transition-shadow hover:shadow-[0_0_36px_rgba(232,193,95,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {isFinalQuestion ? th.finalLeaderboardHeading : th.continueButton}
          </motion.button>
        ) : (
          <p className="text-center text-sm text-[#a7aebd]">{t.multiplayerPlayer.waitingForNextMessage}</p>
        )}
      </div>
    </main>
  );
}
