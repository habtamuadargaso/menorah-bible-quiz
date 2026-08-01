"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { QuizResult } from "@/components/QuizCard";
import { saveScore } from "@/lib/leaderboard";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { loadProgress, levelForXp } from "@/lib/progress";
import { MAX_GAME_LEVEL } from "@/lib/levels";
import { hasPassedLevel, PASSING_CORRECT_ANSWERS } from "@/lib/campaign";
import { ACHIEVEMENTS, type AchievementId } from "@/lib/achievements";
import MobileAmbientGlow from "./MobileAmbientGlow";
import AnimatedNumber from "./AnimatedNumber";
import PremiumScoreRing from "@/components/results/PremiumScoreRing";
import ResultsXpSummary from "@/components/results/ResultsXpSummary";

// Mission 16 — mobile-only "Bible Journey" celebration screen. Reuses the
// exact same QuizResult data and the exact same lib/leaderboard.ts,
// lib/progress.ts, lib/campaign.ts, lib/achievements.ts calls as the
// desktop ResultCard.tsx (untouched) — this only changes presentation: a
// single premium hero (check/stars/XP/coins/accuracy) up top instead of a
// long stacked page, with the existing save-to-leaderboard, achievements,
// and share features kept below so nothing is removed, just reorganized.
// Mission 17.5 — value text is tinted per the centralized reward-color
// mapping (section 5: coins gold, XP violet, correct/accuracy green,
// neutral otherwise) so the same reward always reads the same color
// everywhere it appears, not just here.
const STAT_TONE_CLASSES = {
  gold: "text-gold-400",
  violet: "text-purple-300",
  success: "text-success-400",
  neutral: "text-[#f3efe2]",
} as const;

function StatPill({
  icon,
  value,
  count,
  prefix = "",
  suffix = "",
  label,
  tone = "neutral",
}: {
  icon: string;
  /** Plain display string (e.g. "6/10") — used when `count` isn't given. */
  value?: string;
  /** Mission 20 — a raw number to count up from 0 on mount, celebration-style. */
  count?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  tone?: keyof typeof STAT_TONE_CLASSES;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-3 text-center">
      <span className="text-base" aria-hidden>
        {icon}
      </span>
      <span className={`font-display text-lg font-bold ${STAT_TONE_CLASSES[tone]}`}>
        {typeof count === "number" ? (
          <>
            {prefix}
            <AnimatedNumber value={count} duration={0.9} startFromZero />
            {suffix}
          </>
        ) : (
          value
        )}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-[#9aa1b0]">{label}</span>
    </div>
  );
}

export default function MobileLevelComplete({
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
  const { t, lang } = useLanguage();
  const isAmharic = lang === "am";
  const reduceMotion = useReducedMotion();
  const categoryText = t.categories[result.categoryId];
  const pct = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const passed = hasPassedLevel(result.correct, result.total);
  const wrongCount = Math.max(0, result.total - result.correct);
  const baseXp = result.correct * 20;
  const bonusXp = Math.max(0, result.xpEarned - baseXp);

  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState(loadProgress());
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  useEffect(() => {
    setProgress(loadProgress());
  }, [result]);

  const player = levelForXp(progress.totalXp);
  const encouragement = pct >= 90 ? t.result.tier.master : pct >= 70 ? t.result.tier.scholar : pct >= 50 ? t.result.tier.believer : t.result.tier.keepStudying;

  function nextLevelTier(level: number) {
    return level <= 3 ? t.campaign.foundation : level <= 7 ? t.campaign.growingDisciple : t.campaign.scriptureMaster;
  }

  function handleSave() {
    saveScore({
      name: name.trim() || t.battle.player,
      categoryTitle: categoryText?.title ?? t.common.appName,
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
    const shareText = t.result.shareText
      .replace("{score}", String(result.score))
      .replace("{correct}", String(result.correct))
      .replace("{total}", String(result.total))
      .replace("{category}", categoryText?.title ?? t.common.appName)
      .replace("{appName}", t.common.appName);
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
      // user cancelled the native share sheet
    }
  }

  return (
    <section className="relative mx-auto max-w-md overflow-hidden px-4 pb-10 pt-6 text-center">
      <MobileAmbientGlow />
      <motion.div initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduceMotion ? 0.2 : 0.45, ease: "easeOut" }}>
        <PremiumScoreRing score={result.score} correct={result.correct} total={result.total} headline={result.perfect ? t.result.headline.perfect : passed ? t.result.headline.levelComplete : t.result.headline.keepStudying} pointsLabel={t.result.points} />
      </motion.div>
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        className="mt-3 font-display text-lg font-bold text-gold-300"
      >
        {encouragement}
      </motion.div>

      <motion.div initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35 }} className="mt-5">
        <ResultsXpSummary baseXp={baseXp} bonusXp={bonusXp} totalXp={result.xpEarned} labels={{ earned: t.result.stats.xpEarned, bonus: isAmharic ? "ጉርሻ XP" : "Bonus XP", total: t.profile.totalXp }} />
      </motion.div>

      <motion.section aria-label={t.result.accuracy} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.35 }} className="mt-4 grid grid-cols-2 gap-2">
        <StatPill icon="🎯" count={pct} suffix="%" label={t.result.accuracy} tone="success" />
        <StatPill icon="✅" count={result.correct} label={t.result.correct} tone="success" />
        <StatPill icon="✕" count={wrongCount} label={t.result.stats.wrongAnswers} />
        <StatPill icon="♥" count={result.livesRemaining} label={t.common.lives} tone="gold" />
      </motion.section>

      {/* ---------------- unlock banner ---------------- */}
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.35 }}
        className={`mt-4 rounded-card-sm border p-4 text-left ${
          passed ? "border-gold-500/30 bg-glass-gold shadow-premium" : "border-purple-400/25 bg-glass-purple"
        }`}
      >
        {passed ? (
          result.level >= MAX_GAME_LEVEL ? (
            <p className="text-sm font-semibold text-gold-300">{t.campaign.completedAll}</p>
          ) : (
            <>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
                {isAmharic ? "አዲስ ደረጃ" : "NEW LEVEL"}
              </div>
              <div className="mt-0.5 font-display text-lg font-bold text-[#fbf6e8]">
                {nextLevelTier(result.level + 1)}
              </div>
              <p className="mt-1 text-xs text-[#c6cbd6]">
                {t.campaign.unlocked.replace("{level}", String(result.level + 1))}
              </p>
            </>
          )
        ) : (
          <p className="text-xs font-semibold text-purple-200">
            {t.campaign.needToUnlock} ({result.correct}/{PASSING_CORRECT_ANSWERS} {isAmharic ? "ያስፈልጋል" : "needed"})
          </p>
        )}
      </motion.div>

      {/* ---------------- primary actions ---------------- */}
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.35 }}
        className="mt-5 flex flex-col gap-2.5"
      >
        {canNextLevel ? (
          <motion.button
            onClick={onNextLevel}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            className="w-full rounded-full bg-gradient-to-br from-gold-300 to-gold-600 py-3.5 text-sm font-bold text-navy-900 shadow-gold outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {isAmharic ? "ጉዞውን ይቀጥሉ" : "Continue Journey"} ▶
          </motion.button>
        ) : (
          <motion.button
            onClick={onRestart}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            className="w-full rounded-full bg-gradient-to-br from-gold-400 to-gold-600 py-3.5 text-sm font-bold text-navy-900 shadow-gold outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            ↻ {passed ? t.result.restartButton : t.campaign.practiceAgain}
          </motion.button>
        )}
        {canNextLevel && (
          <motion.button
            onClick={onRestart}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            className="min-h-[48px] w-full rounded-full border border-gold-500/50 py-3 text-sm font-semibold text-gold-300 outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            ↻ {t.result.restartButton}
          </motion.button>
        )}
        <motion.button
          onClick={onCategories}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          className="w-full rounded-full border border-gold-500/50 py-3 text-sm font-semibold text-gold-500 outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          🏠 {isAmharic ? "መነሻ" : "Home"}
        </motion.button>
      </motion.div>

      {/* ---------------- player progress ---------------- */}
      <div className="mt-6 rounded-[20px] border border-purple-400/25 bg-glass-purple p-4 text-left shadow-premium">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">{t.result.playerProgress}</div>
            <div className="mt-0.5 font-display text-lg font-bold text-[#fbf6e8]">
              {t.common.level} {player.level} · {progress.coins} 🪙
            </div>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={t.result.playerProgress} aria-valuenow={player.progressPct} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            initial={reduceMotion ? { width: `${player.progressPct}%` } : { width: 0 }}
            animate={{ width: `${player.progressPct}%` }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.8, delay: 0.4 }}
            className="h-full rounded-full bg-gradient-to-r from-purple-400 to-gold-400"
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-[#9aa1b0]" id="mobile-xp-progress-label">
          <span>{t.result.nextPlayerLevel}</span>
          <span>{player.xpIntoLevel} / {player.xpForNextLevel} XP</span>
        </div>
      </div>

      {/* ---------------- achievements ---------------- */}
      {newBadges.length > 0 && <div className="mt-4 rounded-[24px] border border-gold-500/30 bg-gold-500/[0.06] p-4 shadow-premium">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">{t.achievements.heading}</div>
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-3">
          {ACHIEVEMENTS.filter((def) => newBadges.includes(def.id)).map((def) => {
            const text = t.achievements.list[def.id];
            return (
              <div key={def.id} className="relative flex w-[68px] flex-col items-center gap-1 text-center" title={text.description}>
                <span className="absolute -top-1.5 z-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-navy-900">{t.achievements.newTag}</span>
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/60 bg-gold-500/15 text-base text-gold-300 shadow-gold">{def.icon}</div>
                <div className="text-[9px] font-semibold leading-snug text-[#f3efe2]">{text.title}</div>
              </div>
            );
          })}
        </div>
      </div>}

      {/* ---------------- save / share / leaderboard ---------------- */}
      <div className="mt-4 flex flex-col items-center gap-3">
        {!saved ? (
          <div className="flex w-full flex-col gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder={t.result.namePlaceholder}
              aria-label={t.result.namePlaceholder}
              className="w-full rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-[#f3efe2] outline-none placeholder:text-[#7c8394] focus:border-gold-500/60 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
            />
            <button
              onClick={handleSave}
              className="w-full rounded-full bg-gradient-to-br from-gold-400 to-gold-600 py-3 text-sm font-bold text-navy-900 shadow-gold outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
            >
              {t.result.saveButton}
            </button>
          </div>
        ) : (
          <div className="text-sm font-semibold text-gold-500">{t.result.savedMessage}</div>
        )}

        <div className="flex w-full items-center gap-2.5">
          <button
            onClick={onLeaderboard}
            className="min-h-[44px] flex-1 rounded-full border border-white/20 py-2.5 text-xs font-semibold text-[#c6cbd6] outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {t.result.leaderboardButton}
          </button>
          <button
            onClick={handleShare}
            aria-label={t.result.shareLabel}
            className="min-h-[44px] flex-1 rounded-full border border-white/20 py-2.5 text-xs font-semibold text-[#c6cbd6] outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={shareState}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 3 }}
                transition={{ duration: reduceMotion ? 0.1 : 0.15 }}
                className="inline-block"
              >
                {shareState === "copied" ? `✓ ${t.result.shareCopied}` : `📤 ${t.result.shareButton}`}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>
    </section>
  );
}
