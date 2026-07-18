"use client";

import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CategoryId } from "@/lib/categories";
import { loadQuestionsForGame } from "@/lib/questions/loadQuestionsForGame";
import type { Question, Difficulty } from "@/lib/questions/types";
import { getLevelConfig } from "@/lib/game/levelConfig";
import { MAX_GAME_LEVEL } from "@/lib/levels";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { playCorrectSound, playFinishSound, playTimeoutSound, playWrongSound, startGameMusic, stopGameMusic } from "@/lib/sound";

const MAX_LIVES = 3;

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
    <svg viewBox="0 0 24 24" className="h-4 w-4">
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
    <div
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
        tone === "gold"
          ? "border-gold-500/25 bg-gold-500/10 text-gold-400"
          : "border-purple-400/25 bg-purple-500/10 text-purple-200"
      }`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

// The large circular countdown. Purple track, gold progress arc, with a
// gentle pulse in the last 5 seconds and an urgent pulse in the last 3 —
// purely presentational; the countdown itself lives entirely in QuizCard.
const CircularTimer = memo(function CircularTimer({
  timeLeft,
  timerPct,
  timerColor,
}: {
  timeLeft: number;
  timerPct: number;
  timerColor: string;
}) {
  const urgent = timeLeft <= 3;
  const warning = timeLeft <= 5;

  return (
    <motion.div
      className="relative flex h-24 w-24 items-center justify-center rounded-full sm:h-28 sm:w-28"
      animate={
        urgent
          ? { scale: [1, 1.08, 1] }
          : warning
          ? { scale: [1, 1.04, 1] }
          : { scale: 1 }
      }
      transition={
        warning
          ? { duration: urgent ? 0.5 : 0.9, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.25 }
      }
      role="timer"
      aria-label={`${timeLeft} seconds remaining`}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: "conic-gradient(rgba(139,92,246,0.35) 100%, transparent 0)" }}
      />
      <div
        className="absolute inset-[3px] rounded-full transition-[background] duration-300"
        style={{
          background: `conic-gradient(${timerColor} ${timerPct}%, rgba(255,255,255,0.08) 0)`,
        }}
      />
      <div
        className="absolute inset-[10px] flex items-center justify-center rounded-full bg-navy-950 text-2xl font-extrabold shadow-[inset_0_0_18px_rgba(0,0,0,0.4)] sm:text-3xl"
        style={{ color: timerColor }}
      >
        {timeLeft}
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
}: {
  label: string;
  state: AnswerState;
  disabled: boolean;
  optionLetter: string;
  choiceIndex: number;
  onSelect: (choiceIndex: number) => void;
}) {
  const stateClasses: Record<AnswerState, string> = {
    idle: "border-white/15 bg-white/[0.04] text-[#f3efe2] hover:border-gold-500/50 hover:bg-white/[0.07]",
    correct: "border-emerald-400/70 bg-emerald-500/15 text-[#f3efe2] shadow-[0_0_24px_rgba(52,211,153,0.35)]",
    wrong: "border-red-400/70 bg-red-500/15 text-[#f3efe2] shadow-[0_0_20px_rgba(239,68,68,0.25)]",
    muted: "border-white/10 bg-white/[0.02] text-[#7c8394]",
  };

  const ariaSuffix =
    state === "correct" ? ", correct answer" : state === "wrong" ? ", your answer, incorrect" : "";

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(choiceIndex)}
      aria-label={`${label}${ariaSuffix}`}
      aria-pressed={state === "correct" || state === "wrong"}
      whileHover={disabled ? undefined : { y: -2, scale: 1.015 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`flex min-h-[64px] items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left text-[15px] font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${stateClasses[state]}`}
    >
      <span className="flex items-center gap-3">
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
          transition={{ duration: 0.25 }}
          viewBox="0 0 24 24"
          className="h-5 w-5 flex-shrink-0 text-emerald-300"
        >
          <path d="M4 12.5 9.5 18 20 6" stroke="currentColor" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      )}
      {state === "wrong" && (
        <motion.svg
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          viewBox="0 0 24 24"
          className="h-5 w-5 flex-shrink-0 text-red-300"
        >
          <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </motion.svg>
      )}
    </motion.button>
  );
});

export default function QuizCard({
  categoryId,
  difficulty,
  level,
  onFinish,
  onExit,
}: {
  categoryId: CategoryId;
  difficulty: Difficulty;
  level: number;
  onFinish: (result: QuizResult) => void;
  onExit: () => void;
}) {
  const { t, lang } = useLanguage();
  const categoryText = t.categories[categoryId];
  const timePerQuestion = getLevelConfig(level).timerSeconds;

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
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const autoNextRef = useRef<number | null>(null);
  // Mirrors `timeLeft` so handleAnswer can read the latest value without
  // needing timeLeft in its own dependency array — that keeps its identity
  // (and therefore the memoized answer buttons) stable across every
  // one-second timer tick, instead of recreating/re-rendering them 15
  // times per question.
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const current: Question | undefined = questions[index];
  const isLast =
    questions.length > 0 &&
    index === questions.length - 1;

  useEffect(() => {
    let cancelled = false;

    async function loadRound() {
      setLoadingQuestions(true);
      setQuestions([]);
      setUsedFallback(false);
      setIndex(0);
      setSelected(null);
      setLocked(false);
      setScore(0);
      setCorrectCount(0);
      setStreak(0);
      setBestStreak(0);
      setFastAnswers(0);
      setLives(MAX_LIVES);
      setTimeLeft(timePerQuestion);

      try {
        const loadedQuestions =
          await loadQuestionsForGame(
            lang,
            categoryId,
            level
          );

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
        }
      } finally {
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
  ]);

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
      if (locked || !current) return;
      const isCorrect = choiceIndex === current.correctIndex;
      setLocked(true);
      setSelected(choiceIndex);
      if (isCorrect) {
        playCorrectSound();
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
      setTimeLeft(timePerQuestion);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLast, timePerQuestion]
  );

  if (loadingQuestions) {
    return (
      <section className="mx-auto max-w-xl px-5 py-24 text-center text-[#a7aebd]">
        Loading questions...
      </section>
    );
  }

  if (!current) {
    return (
      <section className="mx-auto max-w-xl px-5 py-24 text-center text-[#a7aebd]">
        {t.quiz.noQuestions}
        <div className="mt-6">
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
  const timerColor = timeLeft <= 5 ? "#e0655f" : "#e8c15f";
  const optionLetters = ["A", "B", "C", "D"];
  const tier = level <= 3 ? t.campaign.foundation : level <= 7 ? t.campaign.growingDisciple : t.campaign.scriptureMaster;

  return (
    <section id="quiz" className="mx-auto max-w-2xl px-5 pb-24 pt-4">
      {usedFallback && (
        <div className="mb-4 rounded-xl border border-gold-500/25 bg-gold-500/5 px-4 py-2 text-center text-xs text-gold-300">
          {t.quiz.fallbackNotice}
        </div>
      )}

      {/* premium header */}
      <div className="mb-5 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 shadow-premium backdrop-blur-md sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold text-[#c6cbd6] outline-none transition-colors hover:text-gold-500 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            <span aria-hidden>←</span>
            {t.quiz.quit}
          </button>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <HeaderStat tone="purple" icon={<span aria-hidden>⭐</span>} label={`${t.common.level} ${level}`} />
            <HeaderStat
              tone="gold"
              icon={<span aria-hidden>✦</span>}
              label={`${t.quiz.questionLabel} ${index + 1}/${questions.length}`}
            />
            <HeaderStat tone="gold" icon={<span aria-hidden>⚡</span>} label={`${t.common.xp} ${score}`} />
            <HeaderStat tone="purple" icon={<span aria-hidden>🪙</span>} label={`${correctCount * 5}`} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-y-1 text-xs">
          <span className="font-semibold uppercase tracking-wide text-[#9aa1b0]">
            {tier} · {categoryText?.title} · {t.quiz.difficulty[difficulty]}
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1" aria-label={t.common.lives}>
              {Array.from({ length: MAX_LIVES }).map((_, i) => (
                <Heart key={i} filled={i < lives} />
              ))}
            </div>
            {streak >= 2 && (
              <span className="font-semibold text-gold-500">
                🔥 {streak} {t.quiz.streak}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-purple-400 to-gold-400"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="mb-6 flex justify-center">
        <CircularTimer timeLeft={timeLeft} timerPct={timerPct} timerColor={timerColor} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-card border border-gold-500/20 bg-glass-gold p-6 shadow-premium-lg backdrop-blur-md sm:p-9"
        >
          <div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[#8d94a3]">
            {t.quiz.difficulty[current.difficulty]}
          </div>
          <div className="mb-7 text-center font-display text-2xl font-semibold leading-snug text-[#fbf6e8] sm:text-[28px] md:text-3xl">
            {current.question}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            {locked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-6 overflow-hidden"
              >
                <div className="rounded-2xl border border-gold-500/25 bg-navy-900/60 p-5">
                  <div className="mb-1.5 flex items-center gap-2 text-sm font-bold text-gold-500">
                    <span aria-hidden>📖</span>
                    {current.reference}
                  </div>
                  <p className="text-sm leading-relaxed text-[#c6cbd6]">{current.explanation}</p>
                </div>
                <motion.button
                  onClick={handleNext}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="mt-5 w-full rounded-full bg-gradient-to-br from-gold-400 to-gold-600 py-3.5 text-[15px] font-bold text-navy-900 shadow-gold outline-none transition-shadow duration-300 hover:shadow-[0_0_36px_rgba(232,193,95,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
                >
                  {isLast ? t.quiz.seeResults : t.quiz.nextQuestion}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
