"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { QuizResult } from "./QuizCard";
import { saveScore } from "@/lib/leaderboard";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { loadProgress, levelForXp } from "@/lib/progress";
import { MAX_GAME_LEVEL } from "@/lib/levels";
import { hasPassedLevel, PASSING_CORRECT_ANSWERS } from "@/lib/campaign";
import { ACHIEVEMENTS, loadUnlockedAchievements, type AchievementId } from "@/lib/achievements";

// ---- Small presentational pieces --------------------------------------

// One tile in the statistics grid. Memoized since the grid re-renders
// whenever the parent's count-up animation ticks displayScore.
const StatTile = memo(function StatTile({
  icon,
  label,
  value,
  tone = "neutral",
  delay = 0,
}: {
  icon: string;
  label: string;
  value: string;
  tone?: "gold" | "purple" | "emerald" | "red" | "neutral";
  delay?: number;
}) {
  const toneClasses: Record<string, string> = {
    gold: "text-gold-400",
    purple: "text-purple-200",
    emerald: "text-emerald-300",
    red: "text-red-300",
    neutral: "text-[#f3efe2]",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-4 text-center shadow-[0_4px_18px_rgba(0,0,0,0.22)] transition-colors hover:border-gold-500/30"
    >
      <div className="text-lg" aria-hidden>
        {icon}
      </div>
      <div className={`mt-1 font-display text-xl font-bold ${toneClasses[tone]}`}>{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-[#9aa1b0]">{label}</div>
    </motion.div>
  );
});

// A single achievement badge — full color + glow when earned, faded/gray
// when locked, with a small "NEW" ribbon for badges unlocked this round.
const AchievementBadge = memo(function AchievementBadge({
  icon,
  title,
  description,
  earned,
  isNew,
  delay = 0,
}: {
  icon: string;
  title: string;
  description: string;
  earned: boolean;
  isNew: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: "backOut" }}
      className="relative flex w-[92px] flex-col items-center gap-1.5 text-center"
      title={description}
    >
      {isNew && (
        <motion.span
          initial={{ opacity: 0, y: -4, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: delay + 0.15, duration: 0.3 }}
          className="absolute -top-2 z-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-navy-900 shadow-gold"
        >
          New
        </motion.span>
      )}
      <div
        aria-hidden
        className={`flex h-14 w-14 items-center justify-center rounded-full border text-xl transition-all ${
          earned
            ? "border-gold-500/60 bg-gold-500/15 text-gold-300 shadow-[0_0_20px_rgba(232,193,95,0.35)]"
            : "border-white/10 bg-white/[0.03] text-[#525971] grayscale"
        }`}
      >
        {icon}
      </div>
      <div className={`text-[11px] font-semibold leading-snug ${earned ? "text-[#f3efe2]" : "text-[#666d80]"}`}>
        {title}
      </div>
    </motion.div>
  );
});

// Ambient ring of sparkles that bursts once behind the trophy on mount.
const TROPHY_SPARKLES = Array.from({ length: 10 }).map((_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  return {
    x: Math.cos(angle) * 90,
    y: Math.sin(angle) * 90,
    delay: (i % 5) * 0.05,
  };
});

function TrophySparkles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {TROPHY_SPARKLES.map((s, i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-gold-300"
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
          animate={{ x: s.x, y: s.y, opacity: [0, 1, 0], scale: [0.4, 1, 0.6] }}
          transition={{ duration: 1.1, delay: s.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// ---- Main component -----------------------------------------------------

export default function ResultCard({
  result,
  newBadges,
  onRestart,
  onNextLevel,
  canNextLevel,
  onCategories,
  onLeaderboard,
}: {
  result: QuizResult;
  newBadges: AchievementId[];
  onRestart: () => void;
  onNextLevel: () => void;
  canNextLevel: boolean;
  onCategories: () => void;
  onLeaderboard: () => void;
}) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const categoryText = t.categories[result.categoryId];
  const pct = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const wrongCount = Math.max(0, result.total - result.correct);
  const timeBonus = result.fastAnswers * 50; // matches the +50 fast-answer bonus applied to `score` in QuizCard
  const perfectXpBonus = 50; // matches finish()'s `(perfect ? 50 : 0)` in QuizCard
  const perfectCoinBonus = 25; // matches finish()'s `(perfect ? 25 : 0)` in QuizCard

  const tier =
    pct >= 90
      ? { label: t.result.tier.master, verse: t.result.verse.master }
      : pct >= 70
        ? { label: t.result.tier.scholar, verse: t.result.verse.scholar }
        : pct >= 50
          ? { label: t.result.tier.believer, verse: t.result.verse.believer }
          : { label: t.result.tier.keepStudying, verse: t.result.verse.keepStudying };

  const [displayScore, setDisplayScore] = useState(0);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState(loadProgress());
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  useEffect(() => {
    setProgress(loadProgress());
  }, [result]);

  useEffect(() => {
    setDisplayScore(0);
    const duration = 900;
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(result.score * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [result.score]);

  const unlockedAchievements = useMemo(() => {
    const stored = new Set(loadUnlockedAchievements());
    newBadges.forEach((id) => stored.add(id));
    return stored;
  }, [newBadges]);
  const newBadgeSet = useMemo(() => new Set(newBadges), [newBadges]);

  function handleSave() {
    saveScore({
      name: name.trim() || "Player",
      categoryTitle: categoryText?.title ?? "Bible Quiz",
      score: result.score,
      correct: result.correct,
      total: result.total,
      date: new Date().toISOString(),
      difficulty: result.difficulty,
      xpEarned: result.xpEarned,
    });
    setSaved(true);
  }

  async function handleShare() {
    const shareText = `I scored ${result.score} points (${result.correct}/${result.total}) on ${categoryText?.title ?? "Bible Quiz"} in Menorah Bible Quiz! 🏆`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text: shareText });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setShareState("copied");
        window.setTimeout(() => setShareState("idle"), 2000);
      }
    } catch {
      // user cancelled the native share sheet — nothing to do
    }
  }

  const player = levelForXp(progress.totalXp);
  const perfect = result.correct === result.total;
  const passed = hasPassedLevel(result.correct, result.total);
  const headline = perfect ? "Perfect!" : passed ? "Level Complete!" : "Keep Studying!";

  return (
    <section id="result" className="relative mx-auto max-w-2xl overflow-hidden px-5 pb-24 pt-6 text-center">
      {/* ambient backdrop — matches the drifting-glow / floating-particle
          language established in QuizCard */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl"
          animate={reduceMotion ? undefined : { opacity: [0.5, 0.9, 0.5], scale: [1, 1.08, 1] }}
          transition={reduceMotion ? undefined : { duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-20 top-64 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl"
          animate={reduceMotion ? undefined : { opacity: [0.4, 0.8, 0.4], scale: [1.05, 0.95, 1.05] }}
          transition={reduceMotion ? undefined : { duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />
        {!reduceMotion &&
          [
            { left: "10%", size: 3, duration: 10, delay: 0 },
            { left: "82%", size: 2, duration: 12, delay: 2 },
            { left: "48%", size: 2.5, duration: 9, delay: 4 },
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

      {/* ---------------- Section 1: celebration hero ---------------- */}
      <motion.div
        initial={{ opacity: 0, y: -14, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "backOut" }}
        className="relative mx-auto flex h-[168px] w-[168px] items-center justify-center rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(232,193,95,0.35), rgba(232,193,95,0.02))",
          boxShadow: "0 0 46px rgba(232,193,95,0.4)",
        }}
      >
        {!reduceMotion && <TrophySparkles />}
        <motion.div
          animate={reduceMotion ? undefined : { scale: [1, 1.05, 1] }}
          transition={reduceMotion ? undefined : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-[136px] w-[136px] flex-col items-center justify-center rounded-full border border-gold-500/50 bg-navy-900"
        >
          <span className="text-5xl drop-shadow-[0_0_18px_rgba(232,193,95,0.6)]" aria-hidden>
            🏆
          </span>
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-5 font-display text-3xl font-bold text-[#fbf6e8] sm:text-4xl"
      >
        {headline}
      </motion.h1>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.28 }}
        className="mt-1.5 font-display text-lg font-semibold text-gold-500"
      >
        {tier.label}
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.34 }}
        className="mt-1 text-sm text-[#a7aebd]"
      >
        {t.campaign.quizLevel} {result.level}/{MAX_GAME_LEVEL} · {categoryText?.title} · {t.quiz.difficulty[result.difficulty]}
      </motion.div>

      {perfect && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          className="mx-auto mt-4 max-w-md rounded-2xl border border-gold-500/35 bg-gold-500/10 px-5 py-3 text-sm font-bold text-gold-300"
        >
          ✨ Perfect round! +{perfectXpBonus} XP · +{perfectCoinBonus} coins bonus
        </motion.div>
      )}

      {/* ---------------- Section 2: statistics card ---------------- */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.32 }}
        className="mt-8 rounded-card border border-gold-500/20 bg-glass-gold p-5 shadow-premium-lg backdrop-blur-md sm:p-7"
      >
        <div className="flex items-center justify-center gap-2">
          <span className="font-display text-4xl font-bold text-gold-400">{displayScore}</span>
          <span className="text-xs uppercase tracking-wide text-[#9aa1b0]">{t.result.points}</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon="✅" label={t.result.correct} value={`${result.correct}/${result.total}`} tone="emerald" delay={0.36} />
          <StatTile icon="🎯" label={t.result.accuracy} value={`${pct}%`} tone="gold" delay={0.4} />
          <StatTile icon="❌" label="Wrong Answers" value={`${wrongCount}`} tone="red" delay={0.44} />
          <StatTile icon="⏱️" label="Time Bonus" value={`+${timeBonus}`} tone="purple" delay={0.48} />
          <StatTile icon="⚡" label="XP Earned" value={`+${result.xpEarned}`} tone="gold" delay={0.52} />
          <StatTile icon="🪙" label="Coins Earned" value={`+${result.coinsEarned}`} tone="purple" delay={0.56} />
          {perfect ? (
            <StatTile icon="🌟" label="Perfect Bonus" value={`+${perfectXpBonus} XP`} tone="gold" delay={0.6} />
          ) : (
            <StatTile icon="🔥" label={t.quiz.streak} value={`${result.bestStreak}`} tone="neutral" delay={0.6} />
          )}
          <StatTile icon="❤️" label={t.common.lives} value={`${result.livesRemaining}`} tone="neutral" delay={0.64} />
        </div>
      </motion.div>

      {/* ---------------- Section 3: XP progress ---------------- */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-5 rounded-[22px] border border-purple-400/25 bg-glass-purple p-5 text-left shadow-premium backdrop-blur-md"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">Player Progress</div>
            <div className="mt-1 font-display text-2xl font-bold text-[#fbf6e8]">
              {t.common.level} {player.level} · {progress.coins} 🪙
            </div>
          </div>
          <motion.div
            initial={{ scale: 0.8, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.6 }}
            className="shrink-0 rounded-full border border-gold-500/40 bg-gold-500/15 px-4 py-2 text-sm font-bold text-gold-300"
          >
            +{result.fastAnswers} ⚡ fast
          </motion.div>
        </div>
        <div
          className="mt-4 flex justify-between text-xs text-[#9aa1b0]"
          id="xp-progress-label"
        >
          <span>Next player level</span>
          <span>{player.xpIntoLevel} / {player.xpForNextLevel} XP</span>
        </div>
        <div
          role="progressbar"
          aria-labelledby="xp-progress-label"
          aria-valuenow={player.progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/10"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${player.progressPct}%` }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-purple-400 to-gold-400"
          />
        </div>
      </motion.div>

      {/* ---------------- Section 4: achievements ---------------- */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.56 }}
        className="mt-5 rounded-[22px] border border-gold-500/20 bg-white/[0.04] p-5 shadow-premium"
      >
        <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{t.achievements.heading}</div>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-4">
          {ACHIEVEMENTS.map((def, i) => {
            const text = t.achievements.list[def.id];
            return (
              <AchievementBadge
                key={def.id}
                icon={def.icon}
                title={text.title}
                description={text.description}
                earned={unlockedAchievements.has(def.id)}
                isNew={newBadgeSet.has(def.id)}
                delay={0.6 + i * 0.05}
              />
            );
          })}
        </div>
      </motion.div>

      {/* ---------------- Section 5: Bible encouragement ---------------- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.75 }}
        className="mt-8 px-4"
      >
        <div className="mx-auto mb-3 flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold-500/60" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">Word of Encouragement</span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold-500/60" />
        </div>
        <p className="mx-auto max-w-md font-display text-lg italic leading-relaxed text-[#c6cbd6] sm:text-xl">
          <span className="text-gold-400">&ldquo;</span>
          {tier.verse}
          <span className="text-gold-400">&rdquo;</span>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className={`mx-auto mt-6 max-w-md rounded-2xl border px-5 py-4 text-sm font-semibold ${passed ? "border-gold-500/25 bg-gold-500/10 text-gold-300" : "border-red-400/25 bg-red-500/10 text-red-200"}`}
      >
        {passed
          ? result.level >= MAX_GAME_LEVEL
            ? t.campaign.completedAll
            : t.campaign.unlocked.replace("{level}", String(result.level + 1))
          : `${t.campaign.needToUnlock} (${result.correct}/${PASSING_CORRECT_ANSWERS} needed)`}
      </motion.div>

      {/* save to leaderboard */}
      {!saved ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder={t.result.namePlaceholder}
            aria-label={t.result.namePlaceholder}
            className="w-full max-w-[220px] rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-[#f3efe2] outline-none placeholder:text-[#7c8394] focus:border-gold-500/60 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          />
          <motion.button
            onClick={handleSave}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-6 py-3 text-sm font-bold text-navy-900 shadow-gold outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {t.result.saveButton}
          </motion.button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-sm font-semibold text-gold-500">
          {t.result.savedMessage}
        </motion.div>
      )}

      {/* ---------------- Section 6: action buttons ---------------- */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        {canNextLevel && (
          <motion.button
            onClick={onNextLevel}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full bg-gradient-to-br from-gold-300 to-gold-600 px-7 py-3.5 text-sm font-bold text-navy-900 shadow-gold outline-none transition-shadow hover:shadow-[0_0_36px_rgba(232,193,95,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            ▶ {t.campaign.continueToLevel.replace("{level}", String(result.level + 1))}
          </motion.button>
        )}
        {!canNextLevel && result.level < MAX_GAME_LEVEL && (
          <motion.button
            onClick={onRestart}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-7 py-3.5 text-sm font-bold text-navy-900 shadow-gold outline-none transition-shadow hover:shadow-[0_0_36px_rgba(232,193,95,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            ▶ {t.campaign.tryLevelAgain.replace("{level}", String(result.level))}
          </motion.button>
        )}
        <motion.button
          onClick={onRestart}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-full border border-gold-500/45 px-7 py-3.5 text-sm font-bold text-gold-300 outline-none transition-colors hover:bg-gold-500/10 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          ↻ {passed ? t.result.restartButton : t.campaign.practiceAgain}
        </motion.button>
        <motion.button
          onClick={onCategories}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-full border border-gold-500/50 px-6 py-3.5 text-sm font-semibold text-gold-500 outline-none transition-colors hover:bg-gold-500/10 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          🏠 {t.result.backToCategoriesButton}
        </motion.button>
        <motion.button
          onClick={onLeaderboard}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-[#c6cbd6] outline-none transition-colors hover:border-gold-500/40 hover:text-gold-500 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          {t.result.leaderboardButton}
        </motion.button>
        <motion.button
          onClick={handleShare}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Share your result"
          className="rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-[#c6cbd6] outline-none transition-colors hover:border-purple-400/50 hover:text-purple-200 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={shareState}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="inline-block"
            >
              {shareState === "copied" ? "✓ Copied!" : "📤 Share"}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </motion.div>
    </section>
  );
}
