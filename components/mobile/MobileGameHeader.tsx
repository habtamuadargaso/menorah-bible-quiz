"use client";

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
}) {
  const urgent = typeof timeLeft === "number" && timeLeft <= 5;

  return (
    <div className="mb-4 rounded-card-sm border border-gold-500/20 bg-white/[0.04] p-3.5 shadow-premium backdrop-blur-md md:hidden">
      <div className="flex items-center justify-between gap-2">
        {onExit ? (
          <button
            onClick={onExit}
            className="flex min-h-[36px] items-center gap-1 rounded-full px-1.5 text-sm font-semibold text-[#c6cbd6] outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
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
              {questionIndex}/{questionCount}
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
    </div>
  );
}
