"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { UIStrings } from "@/lib/i18n/types";
import { ROUND_SECONDS, type RoomQuestionView } from "@/lib/liveBattleRoom";
import SharedBattleTimer from "../shared/SharedBattleTimer";
import ConnectionStatus from "../shared/ConnectionStatus";
import PlayerAnswerButton from "./PlayerAnswerButton";

export default function PlayerQuestion({
  t,
  question,
  questionCount,
  questionEndsAt,
  score,
  streak,
  selectedAnswer,
  hasSubmitted,
  connectionState,
  onSelect,
}: {
  t: UIStrings;
  question: RoomQuestionView;
  questionCount: number;
  questionEndsAt: string | null;
  score: number;
  streak: number;
  selectedAnswer: number | null;
  hasSubmitted: boolean;
  connectionState: "connected" | "reconnecting" | "disconnected";
  onSelect: (index: number) => void;
}) {
  const reduceMotion = useReducedMotion();
  const tp = t.multiplayerPlayer;
  const tb = t.battleShared;

  return (
    <main
      className="min-h-screen w-full px-4 pb-8 pt-6 text-[#f3efe2]"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <header className="flex items-center justify-between">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-[#c6cbd6]">
            {question.questionNumber}/{questionCount}
          </span>
          <ConnectionStatus
            state={connectionState}
            connectedLabel={tb.connectedLabel}
            reconnectingLabel={tb.reconnectingLabel}
            disconnectedLabel={tb.disconnectedLabel}
            compact
          />
        </header>

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#9aa1b0]">{tp.yourScoreLabel}</div>
            <div className="font-display text-lg font-bold text-gold-300">{score}</div>
          </div>
          <SharedBattleTimer endsAt={questionEndsAt} totalSeconds={ROUND_SECONDS} timeUpLabel={tb.timeUpLabel} />
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-[#9aa1b0]">{tp.yourStreakLabel}</div>
            <div className="font-display text-lg font-bold text-purple-300">🔥{streak}</div>
          </div>
        </div>

        <motion.div
          key={question.roomQuestionId}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.35 }}
          className="rounded-card border border-white/10 bg-white/[0.04] p-5 text-center shadow-premium"
        >
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9aa1b0]">{question.reference}</p>
          <h1 className="font-display text-lg font-bold leading-snug text-[#fbf6e8]">{question.questionText}</h1>
        </motion.div>

        <div className="flex flex-col gap-3">
          {question.choices.map((choice, index) => (
            <PlayerAnswerButton
              key={index}
              index={index}
              text={choice}
              isSelected={selectedAnswer === index}
              isLocked={hasSubmitted}
              onSelect={onSelect}
            />
          ))}
        </div>

        {hasSubmitted && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-5 py-4 text-center"
          >
            <p className="font-display text-sm font-bold text-emerald-300">{tp.answerSubmittedMessage}</p>
            <p className="mt-1 text-xs text-[#a7aebd]">{tp.waitingForOthersMessage}</p>
            <span className="sr-only">{tp.youAnsweredAria}</span>
          </motion.div>
        )}
      </div>
    </main>
  );
}
