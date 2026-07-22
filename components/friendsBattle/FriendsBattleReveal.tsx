"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { UIStrings } from "@/lib/i18n/types";
import type { Question } from "@/lib/questions";
import type { FriendsBattleAnswer, FriendsBattlePlayerState } from "@/lib/friendsBattle/types";
import Confetti from "@/components/Confetti";
import { playCorrectSound, playWrongSound } from "@/lib/sound";

export default function FriendsBattleReveal({
  t,
  question,
  players,
  answers,
  isFinalQuestion,
  onContinue,
}: {
  t: UIStrings;
  question: Question;
  players: FriendsBattlePlayerState[];
  answers: FriendsBattleAnswer[];
  isFinalQuestion: boolean;
  onContinue: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const tf = t.friendsBattle;

  const byPlayerIndex = new Map(answers.map((a) => [a.playerIndex, a]));
  const anyoneCorrect = answers.some((a) => a.isCorrect);

  // This component remounts fresh for every question (the parent keys it
  // by questionIndex), so this fires exactly once per reveal — a shared
  // celebration on the one pass-and-play device when at least one player
  // got it right this round.
  useEffect(() => {
    if (anyoneCorrect) playCorrectSound();
    else playWrongSound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      className="min-h-screen w-full px-6 py-10 text-[#f3efe2] lg:px-16"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <Confetti active={anyoneCorrect} />
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
          className="rounded-card border border-emerald-400/30 bg-emerald-500/10 p-6 text-center shadow-premium"
        >
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">{tf.revealHeading}</p>
          <h1 className="mt-2 font-display text-xl font-bold text-[#fbf6e8] lg:text-2xl">
            {question.choices[question.correctIndex]}
          </h1>
        </motion.div>

        <div className="rounded-card border border-white/10 bg-white/[0.04] p-5 shadow-premium">
          <ul className="flex flex-col gap-2" data-testid="reveal-player-list">
            {players.map((player, index) => {
              const answer = byPlayerIndex.get(index);
              const timedOut = answer?.selectedIndex === null;
              return (
                <li
                  key={player.name + index}
                  data-testid={`reveal-row-${index}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <span className="font-display text-sm font-bold text-[#f3efe2]">{player.name}</span>
                  <span className="flex items-center gap-3">
                    {timedOut && (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa1b0]">
                        {tf.timeoutTag}
                      </span>
                    )}
                    <span className={answer?.isCorrect ? "text-emerald-400" : "text-red-400"} aria-hidden>
                      {answer?.isCorrect ? "✔" : "✖"}
                    </span>
                    <span className="font-display text-sm font-bold text-gold-300">
                      {tf.pointsGained.replace("{points}", String(answer?.pointsAwarded ?? 0))}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <motion.button
          type="button"
          onClick={onContinue}
          whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="mx-auto rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-8 py-3.5 text-sm font-bold text-navy-900 shadow-gold outline-none transition-shadow hover:shadow-[0_0_36px_rgba(232,193,95,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          {isFinalQuestion ? tf.seeFinalResultsButton : tf.nextQuestionButton}
        </motion.button>
      </div>
    </main>
  );
}
