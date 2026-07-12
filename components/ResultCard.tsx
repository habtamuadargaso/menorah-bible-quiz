"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { QuizResult } from "./QuizCard";
import { saveScore } from "@/lib/leaderboard";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { loadProgress, levelForXp } from "@/lib/progress";
import { MAX_GAME_LEVEL } from "@/lib/levels";
import { hasPassedLevel, PASSING_CORRECT_ANSWERS } from "@/lib/campaign";
import { ACHIEVEMENTS, type AchievementId } from "@/lib/achievements";

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
  const categoryText = t.categories[result.categoryId];
  const pct = result.total ? Math.round((result.correct / result.total) * 100) : 0;

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

  const player = levelForXp(progress.totalXp);
  const perfect = result.correct === result.total;
  const passed = hasPassedLevel(result.correct, result.total);

  return (
    <section id="result" className="mx-auto max-w-2xl px-5 pb-24 pt-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex h-[158px] w-[158px] items-center justify-center rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(212,175,55,0.32), rgba(212,175,55,0.02))",
          boxShadow: "0 0 34px rgba(212,175,55,0.35)",
        }}
      >
        <div className="flex h-[126px] w-[126px] flex-col items-center justify-center rounded-full border border-gold-500/45 bg-navy-900">
          <div className="font-display text-4xl font-bold text-gold-400">{displayScore}</div>
          <div className="text-[11px] uppercase tracking-wide text-[#9aa1b0]">{t.result.points}</div>
        </div>
      </motion.div>

      <div className="mt-5 font-display text-2xl font-bold text-gold-500">{tier.label}</div>
      <div className="mt-1 text-sm text-[#a7aebd]">
        {t.campaign.quizLevel} {result.level}/{MAX_GAME_LEVEL} · {categoryText?.title} · {t.quiz.difficulty[result.difficulty]} · {result.correct} {t.quiz.ofLabel} {result.total} {t.result.correct.toLowerCase()}
      </div>

      {perfect && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-5 max-w-md rounded-2xl border border-gold-500/35 bg-gold-500/10 px-5 py-3 text-sm font-bold text-gold-300"
        >
          ✨ Perfect round bonus unlocked!
        </motion.div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t.result.correct} value={`${result.correct}/${result.total}`} />
        <Stat label={t.result.accuracy} value={`${pct}%`} />
        <Stat label="XP Earned" value={`+${result.xpEarned}`} highlight />
        <Stat label="Coins Earned" value={`+${result.coinsEarned}`} highlight />
      </div>

      <div className="mt-5 rounded-[22px] border border-gold-500/20 bg-white/[0.04] p-5 text-left">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">Player Progress</div>
            <div className="mt-1 font-display text-2xl font-bold text-[#fbf6e8]">
              Level {player.level} · {progress.coins} coins
            </div>
          </div>
          <motion.div
            initial={{ scale: 0.8, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            className="rounded-full border border-gold-500/40 bg-gold-500/15 px-4 py-2 text-sm font-bold text-gold-300"
          >
            +{result.fastAnswers} ⚡ fast
          </motion.div>
        </div>
        <div className="mt-4 flex justify-between text-xs text-[#9aa1b0]">
          <span>Next player level</span>
          <span>{player.xpIntoLevel} / {player.xpForNextLevel} XP</span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${player.progressPct}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300"
          />
        </div>
      </div>

      {newBadges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 rounded-2xl border border-gold-500/30 bg-gold-500/10 p-5"
        >
          <div className="mb-3 text-xs font-bold uppercase tracking-wide text-gold-400">{t.achievements.newBadge}</div>
          <div className="flex flex-wrap justify-center gap-4">
            {newBadges.map((id) => {
              const def = ACHIEVEMENTS.find((a) => a.id === id);
              const text = t.achievements.list[id];
              return (
                <motion.div key={id} initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-1.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-500 bg-gold-500/20 text-lg text-gold-300">
                    {def?.icon}
                  </div>
                  <div className="text-xs font-semibold text-[#f3efe2]">{text.title}</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      <p className="mt-8 text-sm italic leading-relaxed text-[#8d94a3]">&ldquo;{tier.verse}&rdquo;</p>

      <div className={`mt-5 rounded-2xl border px-5 py-4 text-sm font-semibold ${passed ? "border-gold-500/25 bg-gold-500/10 text-gold-300" : "border-red-400/25 bg-red-500/10 text-red-200"}`}>
        {passed
          ? result.level >= MAX_GAME_LEVEL
            ? t.campaign.completedAll
            : t.campaign.unlocked.replace("{level}", String(result.level + 1))
          : t.campaign.needToUnlock}
      </div>

      {!saved ? (
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder={t.result.namePlaceholder}
            className="w-full max-w-[220px] rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-[#f3efe2] outline-none placeholder:text-[#7c8394] focus:border-gold-500/60"
          />
          <button onClick={handleSave} className="rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-6 py-3 text-sm font-bold text-navy-900 shadow-gold">
            {t.result.saveButton}
          </button>
        </div>
      ) : (
        <div className="mt-8 text-sm font-semibold text-gold-500">{t.result.savedMessage}</div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {canNextLevel && (
          <button onClick={onNextLevel} className="rounded-full bg-gradient-to-br from-gold-300 to-gold-600 px-7 py-3 text-sm font-bold text-navy-900 shadow-gold transition-transform hover:-translate-y-0.5">
            {t.campaign.continueToLevel.replace("{level}", String(result.level + 1))}
          </button>
        )}
        {!canNextLevel && result.level < MAX_GAME_LEVEL && (
          <button onClick={onRestart} className="rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-7 py-3 text-sm font-bold text-navy-900 shadow-gold transition-transform hover:-translate-y-0.5">
            {t.campaign.tryLevelAgain.replace("{level}", String(result.level))}
          </button>
        )}
        <button onClick={onRestart} className="rounded-full border border-gold-500/45 px-7 py-3 text-sm font-bold text-gold-300 transition-transform hover:-translate-y-0.5 hover:bg-gold-500/10">
          {passed ? t.result.restartButton : t.campaign.practiceAgain}
        </button>
        <button onClick={onCategories} className="rounded-full border border-gold-500/50 px-6 py-3 text-sm font-semibold text-gold-500 hover:bg-gold-500/10">
          {t.result.backToCategoriesButton}
        </button>
        <button onClick={onLeaderboard} className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-[#c6cbd6] hover:border-gold-500/40 hover:text-gold-500">
          {t.result.leaderboardButton}
        </button>
      </div>
    </section>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="rounded-2xl border border-gold-500/20 bg-white/[0.04] px-2 py-4">
      <div className={`font-display text-xl font-bold ${highlight ? "text-gold-400" : "text-[#f3efe2]"}`}>{value}</div>
      <div className="mt-1 text-xs text-[#9aa1b0]">{label}</div>
    </motion.div>
  );
}
