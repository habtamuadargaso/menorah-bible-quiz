"use client";

import { useEffect, useRef, useState } from "react";
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

  function handleAnswer(choiceIndex: number, autoAdvance = false) {
    if (locked || !current) return;
    const isCorrect = choiceIndex === current.correctIndex;
    setLocked(true);
    setSelected(choiceIndex);
    if (isCorrect) {
      playCorrectSound();
      const answeredUnderFiveSeconds = timePerQuestion - timeLeft < 5;
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
  }

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
  }

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
            className="rounded-full border border-gold-500/50 px-6 py-3 text-sm font-semibold text-gold-500 hover:bg-gold-500/10"
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

  return (
    <section id="quiz" className="mx-auto max-w-xl px-5 pb-24 pt-4">
      {usedFallback && (
        <div className="mb-4 rounded-xl border border-gold-500/25 bg-gold-500/5 px-4 py-2 text-center text-xs text-gold-300">
          {t.quiz.fallbackNotice}
        </div>
      )}

      <div className="mb-2 flex flex-wrap items-center justify-between gap-y-1 text-xs">
        <span className="font-semibold uppercase tracking-wide text-gold-500">
          {t.common.level} {level}/{MAX_GAME_LEVEL} · {level <= 3 ? t.campaign.foundation : level <= 7 ? t.campaign.growingDisciple : t.campaign.scriptureMaster} · {categoryText?.title} · {t.quiz.difficulty[difficulty]}
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
          {fastAnswers > 0 && <span className="font-semibold text-gold-300">⚡ {fastAnswers}</span>}
          <span className="text-[#9aa1b0]">
            {t.common.level} {level} · {t.quiz.questionLabel} {index + 1} {t.quiz.ofLabel} {questions.length}
          </span>
          <button onClick={onExit} className="text-[#c6cbd6] hover:text-gold-500">
            {t.quiz.quit}
          </button>
        </div>
      </div>

      <div className="mb-7 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="mb-6 flex justify-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(${timerColor} ${timerPct}%, rgba(255,255,255,0.12) 0)` }}
        >
          <div
            className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-navy-900 text-lg font-bold"
            style={{ color: timerColor }}
          >
            {timeLeft}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3 }}
          className="rounded-[22px] border border-gold-500/20 bg-white/[0.045] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:p-9"
        >
          <div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[#8d94a3]">
            {t.quiz.difficulty[current.difficulty]}
          </div>
          <div className="mb-7 text-center font-display text-2xl font-semibold leading-snug text-[#fbf6e8] sm:text-[28px]">
            {current.question}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {current.choices.map((choice, i) => {
              const isCorrectChoice = i === current.correctIndex;
              const isSelected = selected === i;
              let cls =
                "flex items-center justify-between gap-2 rounded-2xl border px-5 py-4 text-left text-[15px] font-medium transition-colors ";
              if (!locked) {
                cls += "border-white/15 bg-white/[0.03] text-[#f3efe2] hover:border-gold-500/50 hover:bg-white/[0.06] cursor-pointer";
              } else if (isCorrectChoice) {
                cls += "border-gold-500 bg-gold-500/20 text-[#fbf6e8]";
              } else if (isSelected) {
                cls += "border-red-400/70 bg-red-500/15 text-[#f3efe2]";
              } else {
                cls += "border-white/10 bg-white/[0.02] text-[#7c8394]";
              }
              return (
                <button key={i} disabled={locked} onClick={() => handleAnswer(i)} className={cls}>
                  <span>{choice}</span>
                  {locked && isCorrectChoice && <span className="font-bold">✓</span>}
                  {locked && isSelected && !isCorrectChoice && <span className="font-bold">✕</span>}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {locked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 overflow-hidden"
              >
                <div className="rounded-2xl border border-gold-500/25 bg-navy-900/60 p-5">
                  <div className="mb-1 text-sm font-semibold text-gold-500">{current.reference}</div>
                  <p className="text-sm leading-relaxed text-[#c6cbd6]">{current.explanation}</p>
                </div>
                <button
                  onClick={handleNext}
                  className="mt-5 w-full rounded-full bg-gradient-to-br from-gold-400 to-gold-600 py-3.5 text-[15px] font-bold text-navy-900 shadow-gold transition-transform hover:-translate-y-0.5"
                >
                  {isLast ? t.quiz.seeResults : t.quiz.nextQuestion}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
