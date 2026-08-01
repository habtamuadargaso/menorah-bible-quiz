"use client";

import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { BookOpen, Check, ChevronDown, ChevronUp, Coins, Sparkles, X } from "lucide-react";
import type { CategoryId } from "@/lib/categories";
import { loadQuestionsForGame } from "@/lib/questions/loadQuestionsForGame";
import type { Question, Difficulty } from "@/lib/questions/types";
import { getLevelConfig } from "@/lib/game/levelConfig";
import { MAX_GAME_LEVEL } from "@/lib/levels";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { playCorrectSound, playFinishSound, playTimeoutSound, playWrongSound, startGameMusic, stopGameMusic } from "@/lib/sound";
import { hapticLight, hapticMedium, hapticWarning } from "@/lib/mobile/haptics";
import MobileGameHeader from "@/components/mobile/MobileGameHeader";
import { Skeleton } from "@/components/ui/Skeleton";

const MAX_LIVES = 3;
const QUESTION_LOAD_TIMEOUT_MS = 15000;

export interface QuizResult {
  categoryId: CategoryId;
  difficulty: Difficulty;
  level: number;
  score: number;
  correct: number;
  total: number;
  bestStreak: number;
  xpEarned: number;
  coinsEarned: number;
  fastAnswers: number;
  perfect: boolean;
  livesRemaining: number;
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-[18px] sm:w-[18px]">
      <path
        d="M12 20s-7-4.35-9.5-8.8C.7 7.6 2.4 4 6 4c2 0 3.3 1.1 4 2.2C10.7 5.1 12 4 14 4c3.6 0 5.3 3.6 3.5 7.2C19 15.65 12 20 12 20Z"
        fill={filled ? "#e0655f" : "none"}
        stroke={filled ? "#e0655f" : "#5b6577"}
        strokeWidth={1.4}
      />
    </svg>
  );
}

// A small pill used for the Level / XP / Coins readouts in the header.
function HeaderStat({
  icon,
  label,
  tone = "gold",
}: {
  icon: ReactNode;
  label: string;
  tone?: "gold" | "purple";
}) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-[0_4px_14px_rgba(0,0,0,0.25)] ${
        tone === "gold"
          ? "border-gold-500/25 bg-gold-500/10 text-gold-400"
          : "border-purple-400/25 bg-purple-500/10 text-purple-200"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center text-[13px] ${
          tone === "gold" ? "drop-shadow-[0_0_6px_rgba(232,193,95,0.6)]" : "drop-shadow-[0_0_6px_rgba(139,92,246,0.6)]"
        }`}
      >
        {icon}
      </span>
      <span>{label}</span>
    </motion.div>
  );
}

// The large circular countdown. Purple track, gold progress arc, with a
// gentle pulse in the last 5 seconds and an urgent pulse in the last 3 —
// purely presentational; the countdown itself lives entirely in QuizCard.
const CircularTimer = memo(function CircularTimer({
  timeLeft,
  timerPct,
  timerColor,
  compact,
  secLabel,
}: {
  timeLeft: number;
  timerPct: number;
  timerColor: string;
  compact?: boolean;
  secLabel?: string;
}) {
  const urgent = timeLeft <= 3;
  const reduceMotion = useReducedMotion();
  const size = compact ? 64 : 108;
  const strokeWidth = compact ? 4 : 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - timerPct / 100);

  return (
    <motion.div
      className={
        compact
          ? "relative flex h-16 w-16 items-center justify-center rounded-full"
          : "relative flex h-24 w-24 items-center justify-center rounded-full sm:h-28 sm:w-28"
      }
      animate={
        urgent && !reduceMotion
          ? { scale: [1, 1.08, 1] }
          : { scale: 1 }
      }
      transition={
        urgent && !reduceMotion
          ? { duration: 0.55, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.25 }
      }
      style={{ filter: `drop-shadow(0 0 18px ${timerColor}55)` }}
      role="timer"
      aria-label={`${timeLeft} seconds remaining`}
    >
      <svg aria-hidden className="absolute inset-0 -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={timerColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={reduceMotion ? undefined : "transition-[stroke-dashoffset,stroke] duration-1000 ease-linear"}
        />
      </svg>
      <div
        className={
          compact
            ? "absolute inset-[6px] flex flex-col items-center justify-center rounded-full bg-navy-950 shadow-[inset_0_0_14px_rgba(0,0,0,0.4)]"
            : "absolute inset-[10px] flex items-center justify-center rounded-full bg-navy-950 text-2xl font-extrabold shadow-[inset_0_0_18px_rgba(0,0,0,0.4)] sm:text-3xl"
        }
        style={{ color: timerColor }}
      >
        {compact ? (
          <>
            <span className="text-lg font-extrabold leading-none">{timeLeft}</span>
            {secLabel && <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wide opacity-80">{secLabel}</span>}
          </>
        ) : (
          timeLeft
        )}
      </div>
    </motion.div>
  );
});

type AnswerState = "idle" | "correct" | "wrong" | "muted";

// One answer choice. Memoized so ticking the timer every second doesn't
// re-render all four buttons — only locked/selected changes do.
const AnswerOption = memo(function AnswerOption({
  label,
  state,
  disabled,
  optionLetter,
  choiceIndex,
  onSelect,
  compact,
}: {
  label: string;
  state: AnswerState;
  disabled: boolean;
  optionLetter: string;
  choiceIndex: number;
  onSelect: (choiceIndex: number) => void;
  compact?: boolean;
}) {
  const stateClasses: Record<AnswerState, string> = {
    idle: "border-white/15 bg-white/[0.04] text-[#f3efe2] hover:border-gold-500/50 hover:bg-white/[0.07] hover:shadow-[0_0_28px_rgba(232,193,95,0.22)]",
    correct: "border-gold-400/80 bg-emerald-500/20 text-[#f3efe2] shadow-[0_0_30px_rgba(52,211,153,0.34)]",
    wrong: "border-red-400/70 bg-red-500/15 text-[#f3efe2] shadow-[0_0_22px_rgba(239,68,68,0.28)]",
    muted: "border-white/10 bg-white/[0.02] text-[#7c8394]",
  };

  const ariaSuffix =
    state === "correct" ? ", correct answer" : state === "wrong" ? ", your answer, incorrect" : "";
  const reduceMotion = useReducedMotion();
  const shake = state === "wrong" && !reduceMotion;

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(choiceIndex)}
      aria-label={`${label}${ariaSuffix}`}
      aria-pressed={state === "correct" || state === "wrong"}
      whileHover={disabled ? undefined : { y: -3, scale: 1.02, transition: { duration: 0.22, ease: "easeOut" } }}
      whileTap={disabled ? undefined : { scale: 0.97, transition: { duration: 0.22, ease: "easeOut" } }}
      animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={shake ? { duration: 0.4, ease: "easeInOut" } : { duration: 0.22, ease: "easeOut" }}
      className={`relative flex items-center justify-between gap-3 rounded-2xl border text-left font-medium outline-none transition-[background-color,border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${
        compact ? "min-h-[68px] px-4 py-3 text-sm" : "min-h-[68px] px-5 py-4 text-[15px]"
      } ${stateClasses[state]}`}
    >
      {/* one-shot result ripple, plays once when this option resolves to correct/wrong */}
      <AnimatePresence>
        {(state === "correct" || state === "wrong") && (
          <motion.span
            key="ripple"
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ border: `2px solid ${state === "correct" ? "#34d399" : "#f87171"}` }}
            initial={{ opacity: 0.55, scale: 0.9 }}
            animate={{ opacity: 0, scale: 1.12 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      <span className="relative flex items-center gap-3">
        <span
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
            state === "correct"
              ? "border-emerald-400/60 text-emerald-300"
              : state === "wrong"
              ? "border-red-400/60 text-red-300"
              : "border-white/20 text-[#9aa1b0]"
          }`}
        >
          {optionLetter}
        </span>
        <span>{label}</span>
      </span>
      {state === "correct" && (
        <motion.svg
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.28, ease: "backOut" }}
          viewBox="0 0 24 24"
          className="relative h-5 w-5 flex-shrink-0 text-emerald-300"
        >
          <path d="M4 12.5 9.5 18 20 6" stroke="currentColor" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      )}
      {state === "wrong" && (
        <motion.svg
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.28, ease: "backOut" }}
          viewBox="0 0 24 24"
          className="relative h-5 w-5 flex-shrink-0 text-red-300"
        >
          <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </motion.svg>
      )}
    </motion.button>
  );
});

// A brief burst of color when a correct answer lands — purely decorative,
// triggered from outside by remounting with a new `burstKey`.
const CONFETTI_PARTICLES = Array.from({ length: 14 }).map((_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  const distance = 70 + (i % 3) * 24;
  const colors = ["#e8c15f", "#a78bfa", "#34d399"];
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance * 0.7 - 10,
    rotate: (i % 2 === 0 ? 1 : -1) * (110 + i * 12),
    color: colors[i % colors.length],
    delay: (i % 5) * 0.025,
    round: i % 2 === 0,
  };
});

function ConfettiBurst({ burstKey }: { burstKey: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      {CONFETTI_PARTICLES.map((p, i) => (
        <motion.span
          key={`${burstKey}-${i}`}
          className={`absolute h-2 w-2 ${p.round ? "rounded-full" : "rounded-sm"}`}
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.6, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 1, rotate: p.rotate }}
          transition={{ duration: 0.9, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function CountUpXp({ value, reduceMotion }: { value: number; reduceMotion: boolean }) {
  const [displayValue, setDisplayValue] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplayValue(value);
      return;
    }
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 500);
      setDisplayValue(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [reduceMotion, value]);

  return <>{displayValue}</>;
}

function XpFlyUp({ xp, reduceMotion }: { xp: number; reduceMotion: boolean }) {
  if (reduceMotion) return null;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 rounded-full border border-gold-300/50 bg-navy-950/95 px-3 py-1.5 text-xs font-extrabold text-gold-300 shadow-gold"
      initial={{ opacity: 0, y: 60, scale: 0.8 }}
      animate={{ opacity: [0, 1, 1, 0], y: [60, 25, -150, -220], scale: [0.8, 1, 0.9, 0.75] }}
      transition={{ duration: 1.05, times: [0, 0.16, 0.76, 1], ease: "easeOut", delay: 0.28 }}
    >
      +{xp} XP
    </motion.div>
  );
}

function ScriptureFeedback({
  correct,
  reference,
  explanation,
  correctAnswer,
  points,
  streak,
  reduceMotion,
  compact,
  onNext,
  nextLabel,
  lang,
}: {
  correct: boolean;
  reference: string;
  explanation: string;
  correctAnswer: string;
  points?: number;
  streak: number;
  reduceMotion: boolean;
  compact?: boolean;
  onNext: () => void;
  nextLabel: string;
  lang: string;
}) {
  return (
    <div className={compact ? "mt-4" : "mt-6"}>
      <p className="sr-only" role="status">
        {correct
          ? `${lang === "am" ? "ትክክለኛ መልስ" : "Correct answer"}${typeof points === "number" ? `, ${points} XP` : ""}`
          : `${lang === "am" ? "የተሳሳተ መልስ" : "Incorrect answer"}. ${lang === "am" ? "ትክክለኛው መልስ" : "Correct answer"}: ${correctAnswer}`}
      </p>
      <div
        className={`rounded-2xl border p-4 text-center ${
          correct
            ? "border-gold-400/45 bg-gold-500/10 shadow-[0_0_32px_rgba(232,193,95,0.16)]"
            : "border-red-400/25 bg-red-500/[0.07]"
        }`}
      >
        <span className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${correct ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
          {correct ? <Check className="h-5 w-5" aria-hidden /> : <X className="h-5 w-5" aria-hidden />}
        </span>
        <p className={`mt-2 font-display text-lg font-bold ${correct ? "text-gold-300" : "text-[#f4d7d3]"}`}>
          {correct ? (lang === "am" ? "በጣም ጥሩ!" : "Great answer!") : (lang === "am" ? "ትንሽ ቀርቶታል።" : "Not quite.")}
        </p>
        {correct && typeof points === "number" ? (
          <p className="mt-1 flex items-center justify-center gap-1 text-sm font-extrabold text-gold-400"><Sparkles className="h-4 w-4" aria-hidden />+<CountUpXp value={points} reduceMotion={reduceMotion} /> XP</p>
        ) : (
          <p className="mt-1 text-sm text-[#c9ced8]">{lang === "am" ? "ትክክለኛው መልስ፦" : "Correct answer:"} <span className="font-bold text-[#fbf6e8]">{correctAnswer}</span></p>
        )}
        {correct && streak >= 2 && <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">🔥 {streak} {lang === "am" ? "በተከታታይ!" : "in a row!"}</p>}
      </div>

      <div className="mt-3 rounded-2xl border border-gold-500/25 bg-[#09152c]/90 p-4 shadow-[0_14px_34px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-gold-500/25 bg-gold-500/10 text-gold-300"><BookOpen className="h-5 w-5" aria-hidden /></span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8f97a7]">{lang === "am" ? "የመጽሐፍ ቅዱስ ማጣቀሻ" : "Bible Reference"}</p>
            <p className="mt-0.5 font-display text-base font-bold text-gold-300">{reference}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#c6cbd6]">{explanation}</p>
      </div>

      <motion.button
        type="button"
        onClick={onNext}
        whileHover={compact ? undefined : { y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="mt-4 min-h-[48px] w-full rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-5 py-3 text-sm font-bold text-navy-950 shadow-gold outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
      >
        {nextLabel}
      </motion.button>
    </div>
  );
}

function MobileFeedbackSheet({
  correct,
  reference,
  explanation,
  correctAnswer,
  points,
  streak,
  reduceMotion,
  onNext,
  nextLabel,
  lang,
}: {
  correct: boolean;
  reference: string;
  explanation: string;
  correctAnswer: string;
  points?: number;
  streak: number;
  reduceMotion: boolean;
  onNext: () => void;
  nextLabel: string;
  lang: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [buttonReady, setButtonReady] = useState(reduceMotion);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const advancingRef = useRef(false);

  useEffect(() => {
    const delay = reduceMotion ? 0 : 250;
    const timer = window.setTimeout(() => {
      setButtonReady(true);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  useEffect(() => {
    if (buttonReady) nextButtonRef.current?.focus({ preventScroll: true });
  }, [buttonReady]);

  useEffect(() => {
    if (!expanded) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [expanded]);

  const sheet = (
    <motion.aside
      role="dialog"
      aria-modal="false"
      aria-label={lang === "am" ? "የመልስ ውጤት" : "Answer feedback"}
      className={`fixed inset-x-0 bottom-0 z-[70] mx-auto flex w-full max-w-[640px] flex-col overflow-hidden rounded-t-[28px] border border-b-0 border-white/15 bg-[#0a1730]/95 shadow-[0_-22px_65px_rgba(0,0,0,0.52)] backdrop-blur-2xl transition-[height] duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${expanded ? "h-[min(60dvh,560px)]" : "h-[min(38dvh,340px)] min-h-[272px]"}`}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: "100%" }}
      transition={reduceMotion ? { duration: 0.01 } : { type: "spring", duration: 0.25, bounce: 0.18 }}
    >
      <div className="flex min-h-0 flex-1 flex-col pb-[calc(73px+env(safe-area-inset-bottom))]">
        <div className="flex flex-none justify-center pb-1 pt-2.5" aria-hidden>
          <span className="h-1.5 w-11 rounded-full bg-white/25" />
        </div>

        <div className={`min-h-0 px-5 ${expanded ? "flex-1 overflow-y-auto overscroll-contain pb-4" : "flex-none pb-2"}`}>
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${correct ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
              {correct ? <Check className="h-5 w-5" aria-hidden /> : <X className="h-5 w-5" aria-hidden />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`font-display text-lg font-bold ${correct ? "text-gold-300" : "text-[#f4d7d3]"}`}>
                {correct ? (lang === "am" ? "በጣም ጥሩ!" : "Great answer!") : (lang === "am" ? "ትንሽ ቀርቶታል።" : "Not quite.")}
              </p>
              {correct && typeof points === "number" ? (
                <p className="flex items-center gap-1 text-sm font-extrabold text-gold-400"><Sparkles className="h-4 w-4" aria-hidden />+<CountUpXp value={points} reduceMotion={reduceMotion} /> XP</p>
              ) : (
                <p className="truncate text-sm text-[#c9ced8]">{lang === "am" ? "ትክክለኛው መልስ፦" : "Correct answer:"} <span className="font-bold text-[#fbf6e8]">{correctAnswer}</span></p>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-gold-500/20 bg-gold-500/[0.07] px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <BookOpen className="h-4 w-4 flex-none text-gold-300" aria-hidden />
                <span className="truncate text-sm font-bold text-gold-300">{reference}</span>
              </div>
              {!expanded && (
                <p
                  className="mt-1.5 overflow-hidden text-xs leading-[18px] text-[#c8ced9]"
                  style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}
                >
                  {explanation}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
              className="flex min-h-[44px] flex-none items-center gap-1 rounded-full px-2 text-xs font-bold text-[#d9deea] outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
            >
              {expanded ? (lang === "am" ? "ያነሰ አሳይ" : "Show Less") : (lang === "am" ? "ተጨማሪ ያንብቡ" : "Read More")}
              {expanded ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
            </button>
          </div>

          {expanded && (
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.25 }}
              className="pt-4"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8f97a7]">{lang === "am" ? "የመጽሐፍ ቅዱስ ማብራሪያ" : "Bible explanation"}</p>
              <p className="mt-2 text-sm leading-6 text-[#d2d6df]">{explanation}</p>
              {correct && streak >= 2 && <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">🔥 {streak} {lang === "am" ? "በተከታታይ!" : "in a row!"}</p>}
            </motion.div>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex-none border-t border-white/10 bg-[#09152c]/95 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          <motion.button
            ref={nextButtonRef}
            type="button"
            disabled={!buttonReady}
            onClick={() => {
              if (advancingRef.current) return;
              advancingRef.current = true;
              onNext();
            }}
            whileTap={buttonReady ? { scale: 0.98 } : undefined}
            className="min-h-[48px] w-full rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-5 py-3 text-sm font-bold text-navy-950 shadow-gold outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {nextLabel}
          </motion.button>
        </div>
      </div>
      <p className="sr-only" aria-live="assertive" aria-atomic="true">
        {correct
          ? `${lang === "am" ? "ትክክለኛ መልስ" : "Correct answer"}${typeof points === "number" ? `, ${points} XP` : ""}`
          : `${lang === "am" ? "የተሳሳተ መልስ" : "Incorrect answer"}. ${lang === "am" ? "ትክክለኛው መልስ" : "Correct answer"}: ${correctAnswer}`}
      </p>
    </motion.aside>
  );

  return createPortal(sheet, document.body);
}

// Mission 17 — mobile-only skeleton shown while questions are loading, in
// the exact shape of the compact mobile layout below (header bar, small
// timer circle, question card, 4 answer bars) so the screen doesn't blank
// or jump when real content arrives. Desktop keeps its plain "Loading
// questions..." text (variant === "desktop" never renders this).
function MobileQuizSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 h-[86px] rounded-card-sm border border-white/10 bg-white/[0.04]" />
      <div className="my-4 flex justify-center">
        <div className="h-16 w-16 rounded-full border border-white/10 bg-white/[0.04]" />
      </div>
      <div className="rounded-card-sm border border-white/10 bg-white/[0.04] p-4">
        <div className="mx-auto mb-4 h-5 w-16 rounded-full bg-white/[0.06]" />
        <div className="mx-auto mb-2 h-5 w-5/6 rounded bg-white/[0.06]" />
        <div className="mx-auto mb-6 h-5 w-2/3 rounded bg-white/[0.06]" />
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[52px] rounded-2xl bg-white/[0.05]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function QuizCard({
  categoryId,
  difficulty,
  level,
  onFinish,
  onExit,
  variant = "desktop",
}: {
  categoryId: CategoryId;
  difficulty: Difficulty;
  level: number;
  onFinish: (result: QuizResult) => void;
  onExit: () => void;
  // Mission 15.6 — app/page.tsx already mounts a dedicated QuizCard instance
  // per breakpoint (its own "hidden md:block" / "md:hidden" wrapper divs), so
  // this picks which single layout THIS instance renders rather than
  // re-hiding both layouts internally with more CSS (which would just
  // double every DOM node — two answer grids, two confetti bursts — for
  // no visual difference, since only one was ever going to be visible).
  variant?: "desktop" | "mobile";
}) {
  const { t, lang } = useLanguage();
  const categoryText = t.categories[categoryId];
  const timePerQuestion = getLevelConfig(level).timerSeconds;
  const reduceMotion = useReducedMotion();

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [fastAnswers, setFastAnswers] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const autoNextRef = useRef<number | null>(null);
  const answerLockedRef = useRef(false);
  const mobileQuestionRef = useRef<HTMLDivElement>(null);
  const selectedAnswerRef = useRef<HTMLDivElement>(null);
  const positionedFeedbackRef = useRef<string | null>(null);
  // Mirrors `timeLeft` so handleAnswer can read the latest value without
  // needing timeLeft in its own dependency array — that keeps its identity
  // (and therefore the memoized answer buttons) stable across every
  // one-second timer tick, instead of recreating/re-rendering them 15
  // times per question.
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // ---- Purely-decorative reward feedback (confetti / floating XP+coins /
  // a heart-loss shake). Every value below is only READ from the real
  // game state above; nothing here writes back into it, so none of the
  // actual scoring, lives, or timer logic is touched.
  const [lastAnswerReward, setLastAnswerReward] = useState<{ key: number; xp: number; coins: number } | null>(null);
  const [confettiKey, setConfettiKey] = useState<number | null>(null);
  const [livesShakeKey, setLivesShakeKey] = useState(0);
  const prevCorrectRef = useRef(correctCount);
  const prevFastAnswersRef = useRef(fastAnswers);
  const prevLivesRef = useRef(lives);

  useEffect(() => {
    const correctDelta = correctCount - prevCorrectRef.current;
    const fastAnswerDelta = fastAnswers - prevFastAnswersRef.current;
    prevCorrectRef.current = correctCount;
    prevFastAnswersRef.current = fastAnswers;
    if (correctDelta <= 0) return;

    const key = Date.now();
    setLastAnswerReward({ key, xp: correctDelta * 20 + Math.max(0, fastAnswerDelta) * 10, coins: correctDelta * 5 });
    if (!reduceMotion) setConfettiKey(key);
    const confettiTimer = window.setTimeout(() => setConfettiKey(null), 1000);
    return () => window.clearTimeout(confettiTimer);
  }, [correctCount, fastAnswers, reduceMotion]);

  useEffect(() => {
    if (lives < prevLivesRef.current) {
      setLivesShakeKey((k) => k + 1);
    }
    prevLivesRef.current = lives;
  }, [lives]);

  const current: Question | undefined = questions[index];
  const isLast =
    questions.length > 0 &&
    index === questions.length - 1;

  useEffect(() => {
    let cancelled = false;

    async function loadRound() {
      setLoadingQuestions(true);
      setLoadError(false);
      setQuestions([]);
      setUsedFallback(false);
      setIndex(0);
      setSelected(null);
      setLocked(false);
      answerLockedRef.current = false;
      setScore(0);
      setCorrectCount(0);
      setStreak(0);
      setBestStreak(0);
      setFastAnswers(0);
      setLives(MAX_LIVES);
      setTimeLeft(timePerQuestion);

      let timeoutId: number | undefined;

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => {
            reject(new Error("Question loading timed out"));
          }, QUESTION_LOAD_TIMEOUT_MS);
        });

        const loadedQuestions = await Promise.race([
          loadQuestionsForGame(
            lang,
            categoryId,
            level
          ),
          timeoutPromise,
        ]);

        if (cancelled) return;

        setQuestions(loadedQuestions);

        setUsedFallback(
          loadedQuestions.length > 0 &&
          !loadedQuestions.some((question) =>
            question.id.startsWith("AI-")
          )
        );
      } catch (error) {
        console.error(
          "Unable to load quiz questions:",
          error
        );

        if (!cancelled) {
          setQuestions([]);
          setLoadError(true);
        }
      } finally {
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }
        if (!cancelled) {
          setLoadingQuestions(false);
        }
      }
    }

    void loadRound();

    return () => {
      cancelled = true;
    };
  }, [
    categoryId,
    lang,
    level,
    timePerQuestion,
    retryToken,
  ]);

  function handleRetryLoad() {
    setRetryToken((n) => n + 1);
  }

  useEffect(() => {
    startGameMusic();
    return () => {
      stopGameMusic();
      if (autoNextRef.current !== null) window.clearTimeout(autoNextRef.current);
    };
  }, []);

  useEffect(() => {
    if (locked || !current) return;
    if (timeLeft <= 0) {
      handleAnswer(-1, true);
      return;
    }
    const timeout = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, locked, current]);

  const handleAnswer = useCallback(
    function handleAnswer(choiceIndex: number, autoAdvance = false) {
      if (answerLockedRef.current || locked || !current) return;
      answerLockedRef.current = true;
      const isCorrect = choiceIndex === current.correctIndex;
      setLocked(true);
      setSelected(choiceIndex);
      if (isCorrect) {
        playCorrectSound();
        hapticLight();
        const answeredUnderFiveSeconds = timePerQuestion - timeLeftRef.current < 5;
        const newStreak = streak + 1;
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        setScore((s) => s + 100 + newStreak * 20 + (answeredUnderFiveSeconds ? 50 : 0));
        setCorrectCount((c) => c + 1);
        if (answeredUnderFiveSeconds) setFastAnswers((c) => c + 1);
      } else {
        if (choiceIndex === -1) playTimeoutSound();
        else playWrongSound();
        hapticWarning();
        setStreak(0);
        setLives((l) => Math.max(0, l - 1));
      }

      // If time runs out, automatically move forward so the game keeps flowing
      // through all 10 questions without the player needing to click.
      if (autoAdvance) {
        autoNextRef.current = window.setTimeout(() => {
          handleNext();
        }, 1400);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locked, current, streak, timePerQuestion]
  );

  function finish() {
    playFinishSound();
    hapticMedium();
    stopGameMusic();
    const total = questions.length;
    const perfect = total > 0 && correctCount === total;
    const xpEarned = correctCount * 20 + fastAnswers * 10 + 100 + (perfect ? 50 : 0);
    const coinsEarned = correctCount * 5 + (perfect ? 25 : 0);
    onFinish({
      categoryId,
      difficulty,
      level,
      score,
      correct: correctCount,
      total,
      bestStreak,
      xpEarned,
      coinsEarned,
      fastAnswers,
      perfect,
      livesRemaining: lives,
    });
  }

  const handleNext = useCallback(
    function handleNext() {
      if (autoNextRef.current !== null) {
        window.clearTimeout(autoNextRef.current);
        autoNextRef.current = null;
      }
      if (isLast) {
        finish();
        return;
      }
      setIndex((i) => i + 1);
      setSelected(null);
      setLocked(false);
      answerLockedRef.current = false;
      setTimeLeft(timePerQuestion);
      setLastAnswerReward(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLast, timePerQuestion]
  );

  useEffect(() => {
    if (variant !== "mobile" || !locked || !current) return;
    const feedbackIsReady = selected !== current.correctIndex || lastAnswerReward !== null;
    if (!feedbackIsReady || positionedFeedbackRef.current === current.id) return;
    positionedFeedbackRef.current = current.id;

    const timer = window.setTimeout(() => {
      const target = selectedAnswerRef.current ?? mobileQuestionRef.current;
      if (!target) return;
      const targetRect = target.getBoundingClientRect();
      const sheetTop = window.innerHeight * 0.58;
      if (targetRect.bottom > sheetTop) {
        window.scrollBy({
          top: Math.min(targetRect.bottom - sheetTop + 12, Math.max(0, targetRect.top - 12)),
          behavior: reduceMotion ? "auto" : "smooth",
        });
      }
    }, reduceMotion ? 0 : 250);

    return () => window.clearTimeout(timer);
  }, [current, lastAnswerReward, locked, reduceMotion, selected, variant]);

  if (loadingQuestions) {
    if (variant === "mobile") {
      return (
        <section className="mx-auto max-w-2xl px-5 pb-24 pt-4">
          <MobileQuizSkeleton />
        </section>
      );
    }
    return (
      <section className="mx-auto max-w-2xl px-5 py-12" role="status" aria-label="Loading questions">
        <div className="rounded-[24px] border border-gold-500/20 bg-white/[0.04] p-7 shadow-premium">
          <Skeleton className="mx-auto h-12 w-12 rounded-2xl" />
          <Skeleton className="mx-auto mt-5 h-7 w-4/5" />
          <Skeleton className="mx-auto mt-3 h-7 w-3/5" />
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-[68px] rounded-2xl" />)}</div>
        </div>
      </section>
    );
  }

  if (!current) {
    return (
      <section className="mx-auto max-w-xl px-5 py-24 text-center text-[#a7aebd]">
        {loadError
          ? lang === "am"
            ? "ጥያቄዎችን መጫን አልተሳካም። እባክዎ ደግመው ይሞክሩ።"
            : "We couldn't load the questions in time. Please try again."
          : t.quiz.noQuestions}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {loadError && (
            <button
              onClick={handleRetryLoad}
              className="rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-6 py-3 text-sm font-bold text-navy-950 shadow-gold outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
            >
              {lang === "am" ? "ደግመው ይሞክሩ" : "Try Again"}
            </button>
          )}
          <button
            onClick={onExit}
            className="rounded-full border border-gold-500/50 px-6 py-3 text-sm font-semibold text-gold-500 outline-none transition-colors hover:bg-gold-500/10 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {t.quiz.backToCategories}
          </button>
        </div>
      </section>
    );
  }

  const progressPct = Math.round(((index + 1) / questions.length) * 100);
  const timerPct = Math.round((timeLeft / timePerQuestion) * 100);
  const timerColor = timeLeft <= 3 ? "#ef6461" : timeLeft <= 5 ? "#f59e42" : "#e8c15f";
  const earnedXp = correctCount * 20 + fastAnswers * 10;
  const feedbackReady = locked && (selected !== current.correctIndex || lastAnswerReward !== null);
  const optionLetters = ["A", "B", "C", "D"];
  const tier = level <= 3 ? t.campaign.foundation : level <= 7 ? t.campaign.growingDisciple : t.campaign.scriptureMaster;

  return (
    <motion.section
      id="quiz"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative mx-auto max-w-2xl overflow-hidden px-5 pb-24 pt-4"
    >
      {/* animated ambient backdrop: drifting glows + soft floating particles */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl"
          animate={reduceMotion ? undefined : { opacity: [0.5, 0.9, 0.5], scale: [1, 1.08, 1] }}
          transition={reduceMotion ? undefined : { duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-20 top-56 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl"
          animate={reduceMotion ? undefined : { opacity: [0.4, 0.8, 0.4], scale: [1.05, 0.95, 1.05] }}
          transition={reduceMotion ? undefined : { duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />
        {!reduceMotion &&
          [
            { left: "12%", size: 3, duration: 10, delay: 0 },
            { left: "78%", size: 2, duration: 12, delay: 2 },
            { left: "45%", size: 2.5, duration: 9, delay: 4 },
            { left: "88%", size: 2, duration: 11, delay: 1 },
            { left: "25%", size: 1.6, duration: 13, delay: 3.5 },
          ].map((p, i) => (
            <motion.span
              key={i}
              className="absolute bottom-0 rounded-full bg-gold-300/50"
              style={{ left: p.left, width: p.size, height: p.size }}
              animate={{ y: ["0%", "-1400%"], opacity: [0, 0.7, 0] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
      </div>

      {usedFallback && (
        <div className="mb-4 rounded-xl border border-gold-500/25 bg-gold-500/5 px-4 py-2 text-center text-xs text-gold-300">
          {t.quiz.fallbackNotice}
        </div>
      )}

      {/* ============ Mission 15.6 — compact mobile layout ============ */}
      {variant === "mobile" && (
        <>
        <MobileGameHeader
          onExit={onExit}
          exitLabel={t.quiz.quit}
          levelLabel={`${t.common.level} ${level}`}
          questionIndex={index + 1}
          questionCount={questions.length}
          questionLabel={t.quiz.questionLabel}
          xp={earnedXp}
          coins={correctCount * 5}
          livesRemaining={lives}
          maxLives={MAX_LIVES}
          streak={streak}
          progressPct={progressPct}
          timer={<CircularTimer compact timeLeft={timeLeft} timerPct={timerPct} timerColor={timerColor} />}
        />

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              ref={mobileQuestionRef}
              key={current.id}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -18 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-[24px] border border-gold-500/35 bg-[#0a1730]/95 p-5 shadow-[0_22px_55px_rgba(0,0,0,0.34)] backdrop-blur-md"
            >
              {/* subtle low-opacity menorah glyph — decorative only, never affects text layout */}
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="pointer-events-none absolute -bottom-3 -right-3 h-20 w-20 text-gold-400 opacity-[0.06]"
              >
                <path
                  d="M12 2v9M12 11c-2.5 0-4-1.6-4-4M12 11c2.5 0 4-1.6 4-4M9 5c-1.6 0-3 .8-3 2.5M15 5c1.6 0 3 .8 3 2.5M12 11c-4 0-7 1.4-7 5v5h14v-5c0-3.6-3-5-7-5Z"
                  stroke="currentColor"
                  strokeWidth={0.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>

              <div className="relative mb-3 flex flex-col items-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gold-500/25 bg-gold-500/10 text-gold-300"><BookOpen className="h-5 w-5" aria-hidden /></span>
                <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">{t.quiz.questionLabel}</span>
              </div>
              <div className="relative mb-6 text-center font-display text-xl font-bold leading-snug tracking-tight text-[#fbf6e8]">
                {current.question}
              </div>

              <div className="relative grid grid-cols-1 gap-2.5">
                {current.choices.map((choice, i) => {
                  const isCorrectChoice = i === current.correctIndex;
                  const isSelected = selected === i;
                  let state: AnswerState = "idle";
                  if (locked) {
                    if (isCorrectChoice) state = "correct";
                    else if (isSelected) state = "wrong";
                    else state = "muted";
                  }
                  return (
                    <div key={i} ref={isSelected ? selectedAnswerRef : undefined}>
                      <AnswerOption
                        compact
                        label={choice}
                        state={state}
                        disabled={locked}
                        optionLetter={optionLetters[i] ?? String(i + 1)}
                        choiceIndex={i}
                        onSelect={handleAnswer}
                      />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {feedbackReady && (
              <MobileFeedbackSheet
                key={current.id}
                correct={selected === current.correctIndex}
                reference={current.reference}
                explanation={current.explanation}
                correctAnswer={current.choices[current.correctIndex]}
                points={lastAnswerReward?.xp}
                streak={streak}
                reduceMotion={Boolean(reduceMotion)}
                onNext={handleNext}
                nextLabel={isLast ? t.quiz.seeResults : t.quiz.nextQuestion}
                lang={lang}
              />
            )}
          </AnimatePresence>

          {confettiKey !== null && <ConfettiBurst burstKey={confettiKey} />}
          {locked && selected === current.correctIndex && lastAnswerReward && <XpFlyUp key={lastAnswerReward.key} xp={lastAnswerReward.xp} reduceMotion={Boolean(reduceMotion)} />}
        </div>
        </>
      )}

      {/* ============ Desktop layout — unchanged from before Mission 15.6 ============ */}
      {variant === "desktop" && (
        <>
        {/* premium header */}
        <div className="mb-5 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 shadow-premium-lg backdrop-blur-md sm:p-6">
          <div className="hidden flex-wrap items-center justify-between gap-3 md:flex">
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold text-[#c6cbd6] outline-none transition-colors hover:text-gold-500 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
            >
              <span aria-hidden>←</span>
              {t.quiz.quit}
            </button>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <HeaderStat
                tone="gold"
                icon={<span aria-hidden>✦</span>}
                label={`${t.quiz.questionLabel} ${index + 1} of ${questions.length}`}
              />
              <HeaderStat tone="gold" icon={<Sparkles className="h-3.5 w-3.5" aria-hidden />} label={`${earnedXp} XP`} />
              <HeaderStat tone="purple" icon={<Coins className="h-3.5 w-3.5" aria-hidden />} label={`${correctCount * 5}`} />
              <CircularTimer compact timeLeft={timeLeft} timerPct={timerPct} timerColor={timerColor} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-y-2 text-xs">
            <span className="font-semibold uppercase tracking-wide text-[#9aa1b0]">
              {tier} · {categoryText?.title} · {t.quiz.difficulty[difficulty]}
            </span>
            <div className="flex items-center gap-4">
              <motion.div
                key={livesShakeKey}
                animate={
                  reduceMotion || livesShakeKey === 0
                    ? undefined
                    : { x: [0, -4, 4, -3, 3, 0] }
                }
                transition={{ duration: 0.4 }}
                className="flex items-center gap-1"
                aria-label={`${lives} of ${MAX_LIVES} ${t.common.lives.toLowerCase()} remaining`}
              >
                {Array.from({ length: MAX_LIVES }).map((_, i) => (
                  <Heart key={i} filled={i < lives} />
                ))}
              </motion.div>
              <AnimatePresence>
                {streak >= 2 && (
                  <motion.span
                    key={streak}
                    initial={{ opacity: 0, scale: 0.7, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.25, ease: "backOut" }}
                    className="flex items-center gap-1 rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-1 font-bold text-gold-400 shadow-[0_0_16px_rgba(232,193,95,0.35)]"
                  >
                    <motion.span
                      aria-hidden
                      animate={reduceMotion ? undefined : { scale: [1, 1.15, 1] }}
                      transition={reduceMotion ? undefined : { duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                    >
                      🔥
                    </motion.span>
                    {streak} {t.quiz.streak}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#aeb5c3]">
            <span>{t.quiz.questionLabel} {index + 1} / {questions.length}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={index + 1}>
            <motion.div
              className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-purple-400 to-gold-400"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {!reduceMotion && (
                <motion.div
                  aria-hidden
                  className="absolute inset-y-0 w-8 bg-white/40 blur-sm"
                  animate={{ x: ["-100%", "260%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
                />
              )}
            </motion.div>
          </div>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-[24px] border border-gold-500/35 bg-[#0a1730]/95 p-6 shadow-[0_24px_65px_rgba(0,0,0,0.38)] backdrop-blur-md sm:p-9"
            >
              <div className="mb-3 flex flex-col items-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold-500/25 bg-gold-500/10 text-gold-300"><BookOpen className="h-6 w-6" aria-hidden /></span>
                <span className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-400">{t.quiz.questionLabel}</span>
              </div>
              <div className="mb-7 text-center font-display text-2xl font-bold leading-snug tracking-tight text-[#fbf6e8] sm:text-[28px] md:text-3xl">
                {current.question}
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {current.choices.map((choice, i) => {
                  const isCorrectChoice = i === current.correctIndex;
                  const isSelected = selected === i;
                  let state: AnswerState = "idle";
                  if (locked) {
                    if (isCorrectChoice) state = "correct";
                    else if (isSelected) state = "wrong";
                    else state = "muted";
                  }
                  return (
                    <AnswerOption
                      key={i}
                      label={choice}
                      state={state}
                      disabled={locked}
                      optionLetter={optionLetters[i] ?? String(i + 1)}
                      choiceIndex={i}
                      onSelect={handleAnswer}
                    />
                  );
                })}
              </div>

              <AnimatePresence>
                {feedbackReady && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, delay: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-6 overflow-hidden"
                  >
                    <ScriptureFeedback correct={selected === current.correctIndex} reference={current.reference} explanation={current.explanation} correctAnswer={current.choices[current.correctIndex]} points={lastAnswerReward?.xp} streak={streak} reduceMotion={Boolean(reduceMotion)} onNext={handleNext} nextLabel={isLast ? t.quiz.seeResults : t.quiz.nextQuestion} lang={lang} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          {confettiKey !== null && <ConfettiBurst burstKey={confettiKey} />}
          {locked && selected === current.correctIndex && lastAnswerReward && <XpFlyUp key={lastAnswerReward.key} xp={lastAnswerReward.xp} reduceMotion={Boolean(reduceMotion)} />}
        </div>
        </>
      )}
    </motion.section>
  );
}
