"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { UIStrings } from "@/lib/i18n/types";
import type { FriendsBattlePlayerState } from "@/lib/friendsBattle/types";
import { FRIENDS_BATTLE_QUESTION_COUNT } from "@/lib/friendsBattle/types";

export default function FriendsBattleFinal({
  t,
  players,
  onPlayAgain,
  onHome,
}: {
  t: UIStrings;
  players: FriendsBattlePlayerState[];
  onPlayAgain: () => void;
  onHome: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const tf = t.friendsBattle;

  const ranked = [...players].sort((a, b) => b.score - a.score);

  return (
    <main
      className="min-h-screen w-full px-4 py-10 text-[#f3efe2]"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <motion.header
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
          className="text-center"
        >
          <h1 className="font-display text-3xl font-bold text-[#fbf6e8]">{tf.finalHeading}</h1>
          {ranked[0] && (
            <p className="mt-2 font-display text-lg font-bold text-gold-300" data-testid="fb-winner">
              {tf.winnerLabel}: {ranked[0].name}
            </p>
          )}
        </motion.header>

        <div className="flex flex-col gap-3" data-testid="fb-final-list">
          {ranked.map((player, index) => {
            const accuracyPct = Math.round((player.correctCount / FRIENDS_BATTLE_QUESTION_COUNT) * 100);
            return (
              <motion.div
                key={player.name + index}
                data-testid={`fb-final-row-${index}`}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0.2 : 0.3, delay: index * 0.05 }}
                className={`flex items-center justify-between rounded-2xl border p-4 shadow-premium ${
                  index === 0 ? "border-gold-500/40 bg-glass-gold" : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-bold text-[#9aa1b0]">#{index + 1}</span>
                  <span className="font-display text-base font-bold text-[#fbf6e8]">{player.name}</span>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[#9aa1b0]">{tf.scoreLabel}</div>
                    <div className="font-display text-base font-bold text-gold-300">{player.score}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[#9aa1b0]">{tf.correctAnswersLabel}</div>
                    <div className="font-display text-base font-bold text-[#f3efe2]">
                      {player.correctCount}/{FRIENDS_BATTLE_QUESTION_COUNT}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[#9aa1b0]">{tf.accuracyLabel}</div>
                    <div className="font-display text-base font-bold text-[#f3efe2]">{accuracyPct}%</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <motion.button
            type="button"
            onClick={onPlayAgain}
            whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className="flex-1 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-6 py-3.5 text-sm font-bold text-navy-900 shadow-gold outline-none transition-shadow hover:shadow-[0_0_36px_rgba(232,193,95,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {tf.playAgainButton}
          </motion.button>
          <button
            type="button"
            onClick={onHome}
            className="flex-1 rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-[#c6cbd6] outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {tf.homeButton}
          </button>
        </div>
      </div>
    </main>
  );
}
