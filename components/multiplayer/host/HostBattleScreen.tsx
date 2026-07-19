"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { UIStrings } from "@/lib/i18n/types";
import { ROUND_SECONDS, type RoomQuestionView } from "@/lib/liveBattleRoom";
import SharedBattleTimer from "../shared/SharedBattleTimer";
import ConnectionStatus from "../shared/ConnectionStatus";

const CHOICE_LETTERS = ["A", "B", "C", "D"];

export default function HostBattleScreen({
  t,
  roomCode,
  question,
  categoryLabel,
  levelLabel,
  questionEndsAt,
  answeredCount,
  totalPlayers,
  connectionState,
}: {
  t: UIStrings;
  roomCode: string;
  question: RoomQuestionView;
  categoryLabel: string;
  levelLabel: string;
  questionEndsAt: string | null;
  answeredCount: number;
  totalPlayers: number;
  connectionState: "connected" | "reconnecting" | "disconnected";
}) {
  const reduceMotion = useReducedMotion();
  const th = t.multiplayerHost;
  const tb = t.battleShared;
  const tm = t.multiplayerLobby;

  return (
    <main
      className="min-h-screen w-full px-6 py-8 text-[#f3efe2] lg:px-16 lg:py-10"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1.5 font-display text-sm font-bold tracking-[0.25em] text-gold-300">
              {roomCode}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#c6cbd6]">
              {categoryLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#c6cbd6]">
              {levelLabel}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wide text-purple-300">{th.audienceViewLabel}</span>
            <ConnectionStatus
              state={connectionState}
              connectedLabel={tb.connectedLabel}
              reconnectingLabel={tb.reconnectingLabel}
              disconnectedLabel={tb.disconnectedLabel}
            />
          </div>
        </header>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-gold-500">
            {tm.playersHeading} • {question.questionNumber}
          </p>
          <SharedBattleTimer endsAt={questionEndsAt} totalSeconds={ROUND_SECONDS} size="lg" timeUpLabel={tb.timeUpLabel} />
        </div>

        <motion.div
          key={question.roomQuestionId}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
          className="mx-auto w-full max-w-4xl rounded-card border border-white/10 bg-white/[0.04] p-8 text-center shadow-premium-lg backdrop-blur-md lg:p-12"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9aa1b0]">{question.reference}</p>
          <h1 className="font-display text-2xl font-bold leading-snug text-[#fbf6e8] lg:text-4xl">{question.questionText}</h1>
        </motion.div>

        <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          {question.choices.map((choice, index) => (
            <div
              key={index}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5 text-left shadow-[0_4px_18px_rgba(0,0,0,0.22)] lg:py-6"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-purple-400/40 bg-purple-500/15 font-display text-sm font-bold text-purple-200">
                {CHOICE_LETTERS[index]}
              </span>
              <span className="font-display text-base font-semibold text-[#f3efe2] lg:text-lg">{choice}</span>
            </div>
          ))}
        </div>

        <div className="mx-auto flex w-full max-w-4xl items-center justify-center gap-4">
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-2.5 text-sm font-bold text-[#c6cbd6]">
            {th.answeredCountLabel.replace("{answered}", String(answeredCount)).replace("{total}", String(totalPlayers))}
          </div>
        </div>
      </div>
    </main>
  );
}
