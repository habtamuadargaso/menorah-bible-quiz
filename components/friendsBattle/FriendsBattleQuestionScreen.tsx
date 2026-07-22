"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { UIStrings } from "@/lib/i18n/types";
import type { Question } from "@/lib/questions";
import { FRIENDS_BATTLE_ROUND_SECONDS, friendsBattleDifficultyLabel, type Difficulty } from "@/lib/friendsBattle/types";
import { playButtonClick, playCountdownTick } from "@/lib/sound";

const CHOICE_LETTERS = ["A", "B", "C", "D"];

/**
 * One player's private 15-second turn. Deliberately has no idea what any
 * other player answered and never reveals correctness itself — that only
 * ever happens on the shared group reveal screen once every player has
 * gone. A timeout calls onTimeout on its own; nothing here ever picks an
 * answer on the player's behalf.
 */
export default function FriendsBattleQuestionScreen({
  t,
  question,
  playerName,
  questionNumber,
  questionCount,
  difficulty,
  onAnswer,
  onTimeout,
}: {
  t: UIStrings;
  question: Question;
  playerName: string;
  questionNumber: number;
  questionCount: number;
  difficulty: Difficulty;
  onAnswer: (index: number) => void;
  onTimeout: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const tf = t.friendsBattle;
  const [secondsLeft, setSecondsLeft] = useState(FRIENDS_BATTLE_ROUND_SECONDS);
  const [locked, setLocked] = useState(false);

  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    const startedAt = Date.now();
    let ticked = false;
    const id = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, FRIENDS_BATTLE_ROUND_SECONDS - elapsedSeconds);
      setSecondsLeft(remaining);
      if (remaining <= 5 && remaining > 0 && !ticked) {
        ticked = true;
        playCountdownTick();
      }
      if (remaining <= 0) {
        window.clearInterval(id);
        setLocked(true);
        onTimeoutRef.current();
      }
    }, 250);
    return () => window.clearInterval(id);
    // Mounts fresh once per player turn (the parent remounts this
    // component via a per-turn key), so this timer only ever needs to run
    // once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(index: number) {
    if (locked) return;
    setLocked(true);
    playButtonClick();
    onAnswer(index);
  }

  const pct = Math.min(1, Math.max(0, secondsLeft / FRIENDS_BATTLE_ROUND_SECONDS));
  const isLow = secondsLeft <= 5 && secondsLeft > 0;

  return (
    <main
      className="min-h-screen w-full px-4 pb-8 pt-6 text-[#f3efe2]"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <header className="flex items-center justify-between">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-[#c6cbd6]">
            {tf.questionOfTotalLabel.replace("{current}", String(questionNumber)).replace("{total}", String(questionCount))}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-gold-300">
            {playerName}
          </span>
        </header>

        <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-[#9aa1b0]" data-testid="fb-difficulty-onscreen">
          {tf.difficultyOnScreenLabel.replace("{difficulty}", friendsBattleDifficultyLabel(t, difficulty))}
        </p>

        <div className="flex items-center justify-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full border-2 font-display text-xl font-bold ${
              isLow ? "border-red-400 text-red-400" : "border-gold-400 text-gold-300"
            }`}
            role="timer"
            aria-live="off"
            data-testid="fb-timer"
            style={{
              background: `conic-gradient(currentColor ${pct * 360}deg, transparent 0deg)`,
            }}
          >
            <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-navy-950" data-testid="fb-timer-value">
              {secondsLeft > 0 ? secondsLeft : "0"}
            </span>
          </div>
        </div>
        {secondsLeft <= 0 && <p className="text-center text-xs font-semibold text-red-300">{tf.timesUpLabel}</p>}

        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.35 }}
          className="rounded-card border border-white/10 bg-white/[0.04] p-5 text-center shadow-premium"
        >
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9aa1b0]">{question.reference}</p>
          <h1 className="font-display text-lg font-bold leading-snug text-[#fbf6e8]">{question.question}</h1>
        </motion.div>

        <div className="flex flex-col gap-3">
          {question.choices.map((choice, index) => (
            <motion.button
              key={index}
              type="button"
              onClick={() => handleSelect(index)}
              disabled={locked}
              data-testid={`fb-choice-${index}`}
              whileHover={reduceMotion || locked ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion || locked ? undefined : { scale: 0.97 }}
              className={`flex min-h-[72px] w-full items-center gap-3 rounded-2xl border-2 border-white/12 bg-white/[0.05] px-5 py-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${
                locked ? "cursor-not-allowed opacity-50" : "cursor-pointer active:opacity-90"
              }`}
            >
              <span
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-purple-400/40 bg-purple-500/15 font-display text-sm font-bold text-purple-200"
                aria-hidden
              >
                {CHOICE_LETTERS[index]}
              </span>
              <span className="font-display text-base font-semibold leading-snug text-[#f3efe2] sm:text-lg">{choice}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </main>
  );
}
