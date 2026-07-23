"use client";

import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { CategoryId } from "@/lib/categories";
import { loadQuestionsForGame } from "@/lib/questions/loadQuestionsForGame";
import type { Question, Difficulty } from "@/lib/questions/types";
import { getLevelConfig } from "@/lib/game/levelConfig";
import { MAX_GAME_LEVEL } from "@/lib/levels";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { playCorrectSound, playFinishSound, playTimeoutSound, playWrongSound, startGameMusic, stopGameMusic } from "@/lib/sound";

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
      style={{ filter: `drop-shadow(0 0 18px ${timerColor}55)` }}
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
    idle: "border-white/15 bg-white/[0.04] text-[#f3efe2] hover:border-gold-500/50 hover:bg-white/[0.07] hover:shadow-[0_0_28px_rgba(232,193,95,0.22)]",
    correct: "border-emerald-400/70 bg-emerald-500/15 text-[#f3efe2] shadow-[0_0_28px_rgba(52,211,153,0.4)]",
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
      className={`relative flex min-h-[64px] items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left text-[15px] font-medium outline-none transition-[background-color,border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${stateClasses[state]}`}
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
  const [rewardToast, setRewardToast] = useState<{ key: number; points: number; coins: number } | null>(null);
  const [confettiKey, setConfettiKey] = useState<number | null>(null);
  const [livesShakeKey, setLivesShakeKey] = useState(0);
  const prevScoreRef = useRef(score);
  const prevCorrectRef = useRef(correctCount);
  const prevLivesRef = useRef(lives);

  useEffect(() => {
    const scoreDelta = score - prevScoreRef.current;
    const correctDelta = correctCount - prevCorrectRef.current;
    prevScoreRef.current = score;
    prevCorrectRef.current = correctCount;
    if (scoreDelta <= 0) return;

    const key = Date.now();
    setRewardToast({ key, points: scoreDelta, coins: correctDelta * 5 });
    if (!reduceMotion) setConfettiKey(key);
    const toastTimer = window.setTimeout(() => setRewardToast(null), 1300);
    const confettiTimer = window.setTimeout(() => setConfettiKey(null), 1000);
    return () => {
      window.clearTimeout(toastTimer);
      window.clearTimeout(confettiTimer);
    };
  }, [score, correctCount, reduceMotion]);

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
  const timerColor = timeLeft <= 5 ? "#e0655f" : "#e8c15f";
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

      {/* premium header */}
      <div className="mb-5 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 shadow-premium-lg backdrop-blur-md sm:p-6">
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
            <HeaderStat tone="gold" icon={<span aria-hidden>⚡</span>} label={`${t.result.score} ${score}`} />
            <HeaderStat tone="purple" icon={<span aria-hidden>🪙</span>} label={`${correctCount * 5}`} />
          </div>
        </div>

        {/* floating "+XP / +coins" toast, plays once per correct answer */}
        <div className="relative">
          <AnimatePresence>
            {rewardToast && (
              <motion.div
                key={rewardToast.key}
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: -6, scale: 1 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="pointer-events-none absolute left-1/2 top-1 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-gold-400/40 bg-navy-950/90 px-4 py-1.5 text-sm font-bold shadow-gold"
              >
                <span className="text-gold-300">⚡ +{rewardToast.points} {t.result.score}</span>
                <span className="text-purple-200">🪙 +{rewardToast.coins}</span>
              </motion.div>
            )}
          </AnimatePresence>
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

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
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

      <div className="mb-6 flex justify-center">
        <CircularTimer timeLeft={timeLeft} timerPct={timerPct} timerColor={timerColor} />
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-card border border-gold-500/20 bg-glass-gold p-6 shadow-premium-lg backdrop-blur-md sm:p-9"
          >
            <div className="mb-3 flex justify-center">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#8d94a3]">
                {t.quiz.difficulty[current.difficulty]}
              </span>
            </div>
            <div className="mb-3 text-center font-display text-2xl font-bold leading-snug tracking-tight text-[#fbf6e8] sm:text-[28px] md:text-3xl">
              {current.question}
            </div>

            <div className="mb-6 flex items-center justify-center gap-2 text-sm font-bold text-gold-500">
              <span aria-hidden>📖</span>
              {current.reference}
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
              {locked && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-6 overflow-hidden"
                >
                  <div className="rounded-2xl border border-gold-500/25 bg-navy-900/60 p-5 shadow-premium">
                    <p className="text-sm leading-relaxed text-[#c6cbd6]">{current.explanation}</p>
                  </div>
                  <motion.button
                    onClick={handleNext}
                    whileHover={{ y: -2, scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="mt-5 w-full rounded-full bg-gradient-to-br from-gold-400 to-gold-600 py-3.5 text-[15px] font-bold text-navy-900 shadow-gold outline-none transition-shadow duration-300 hover:shadow-[0_0_36px_rgba(232,193,95,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
                  >
                    {isLast ? t.quiz.seeResults : t.quiz.nextQuestion}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {confettiKey !== null && <ConfettiBurst burstKey={confettiKey} />}
      </div>
    </motion.section>
  );
}
