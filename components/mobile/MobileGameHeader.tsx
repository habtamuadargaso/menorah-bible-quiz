"use client";

import type { ReactNode } from "react";

// Mission 15 — compact, mobile-only gameplay header shared by Solo Quiz,
// Live Battle (host + player), and Friends Battle question screens. Every
// value here is already computed by the caller (timer state, score,
// question index, connection state) — this component never runs a timer,
// never submits an answer, never touches scoring. It only renders numbers
// it's given, so canonical question IDs / timer / scoring logic in
// QuizCard.tsx, HostBattleScreen.tsx, PlayerQuestion.tsx, and
// FriendsBattleQuestionScreen.tsx stay completely untouched.
export default function MobileGameHeader({
  onExit,
  exitLabel,
  levelLabel,
  questionIndex,
  questionCount,
  timeLeft,
  score,
  scoreLabel,
  livesRemaining,
  maxLives,
  streak,
  roomCode,
  connectionState,
  progressPct,
  coins,
  xp,
  timer,
  questionLabel = "Question",
}: {
  onExit?: () => void;
  exitLabel?: string;
  levelLabel?: string;
  questionIndex?: number;
  questionCount?: number;
  timeLeft?: number;
  score?: number;
  scoreLabel?: string;
  livesRemaining?: number;
  maxLives?: number;
  streak?: number;
  roomCode?: string;
  connectionState?: "connected" | "reconnecting" | "disconnected";
  /** 0-100. Optional — only Solo Quiz passes this today; Live/Friends Battle callers are unaffected if they omit it. */
  progressPct?: number;
  coins?: number;
  xp?: number;
  timer?: ReactNode;
  questionLabel?: string;
}) {
  const urgent = typeof timeLeft === "number" && timeLeft <= 5;

  return (
    <div className="mb-4 rounded-[22px] border border-gold-500/20 bg-[#0b1730]/90 p-3.5 shadow-premium backdrop-blur-md md:hidden">
      <div className="flex items-center justify-between gap-2">
        {onExit ? (
          <button
            onClick={onExit}
            className="flex min-h-[44px] items-center gap-1 rounded-full px-1.5 text-sm font-semibold text-[#e3dfd5] outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            <span aria-hidden>←</span>
            {exitLabel}
          </button>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-wide text-gold-400">{roomCode ? `#${roomCode}` : ""}</span>
        )}

        <div className="flex items-center gap-2">
          {typeof questionIndex === "number" && typeof questionCount === "number" && (
            <span className="rounded-full border border-gold-500/25 bg-gold-500/10 px-2.5 py-1 text-xs font-bold text-gold-400">
              {questionLabel} {questionIndex} of {questionCount}
            </span>
          )}
          {typeof timeLeft === "number" && (
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                urgent ? "border-red-400/50 bg-red-500/10 text-red-300" : "border-gold-500/25 bg-gold-500/10 text-gold-400"
              }`}
            >
              {timeLeft}s
            </span>
          )}
          {timer}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {levelLabel && <span className="font-semibold text-[#9aa1b0]">{levelLabel}</span>}
          {connectionState && connectionState !== "connected" && (
            <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-300">
              {connectionState}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {typeof xp === "number" && <span className="font-bold text-gold-300">✦ {xp} XP</span>}
          {typeof coins === "number" && <span className="font-bold text-purple-200">● {coins}</span>}
          {typeof score === "number" && (
            <span className="font-bold text-gold-400">
              {scoreLabel ?? "⚡"} {score}
            </span>
          )}
          {typeof streak === "number" && streak >= 2 && <span className="font-bold text-gold-400">🔥 {streak}</span>}
          {typeof livesRemaining === "number" && typeof maxLives === "number" && (
            <span className="flex items-center gap-0.5" aria-label={`${livesRemaining} of ${maxLives} lives remaining`}>
              {Array.from({ length: maxLives }).map((_, i) => (
                <span key={i} aria-hidden className={i < livesRemaining ? "text-red-400" : "text-[#3a4257]"}>
                  ♥
                </span>
              ))}
            </span>
          )}
        </div>
      </div>

      {typeof progressPct === "number" && (
        <>
          <div className="mt-2.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-[#8f97a7]">
            {typeof questionIndex === "number" && typeof questionCount === "number" && <span>{questionLabel} {questionIndex} / {questionCount}</span>}
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={1} aria-valuemax={questionCount} aria-valuenow={questionIndex}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-600 transition-[width] duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
