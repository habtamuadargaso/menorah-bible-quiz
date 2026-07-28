"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { QuizResult } from "@/components/QuizCard";
import { saveScore } from "@/lib/leaderboard";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { loadProgress, levelForXp } from "@/lib/progress";
import { MAX_GAME_LEVEL } from "@/lib/levels";
import { hasPassedLevel, PASSING_CORRECT_ANSWERS } from "@/lib/campaign";
import { ACHIEVEMENTS, loadUnlockedAchievements, type AchievementId } from "@/lib/achievements";
import MobileAmbientGlow from "./MobileAmbientGlow";

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
  label,
  tone = "neutral",
}: {
  icon: string;
  value: string;
  label: string;
  tone?: keyof typeof STAT_TONE_CLASSES;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-3 text-center">
      <span className="text-base" aria-hidden>
        {icon}
      </span>
      <span className={`font-display text-lg font-bold ${STAT_TONE_CLASSES[tone]}`}>{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-[#9aa1b0]">{label}</span>
    </div>
  );
}

const STAR_BURST = Array.from({ length: 8 }).map((_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return { x: Math.cos(angle) * 70, y: Math.sin(angle) * 70, delay: (i % 4) * 0.06 };
});

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

  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState(loadProgress());
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  useEffect(() => {
    setProgress(loadProgress());
  }, [result]);

  const unlockedAchievements = useMemo(() => {
    const stored = new Set(loadUnlockedAchievements());
    newBadges.forEach((id) => stored.add(id));
    return stored;
  }, [newBadges]);
  const newBadgeSet = useMemo(() => new Set(newBadges), [newBadges]);
  const player = levelForXp(progress.totalXp);

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
      {/* ---------------- hero ---------------- */}
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0.2 : 0.4, ease: "backOut" }}
        className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full"
        style={{
          background: passed
            ? "radial-gradient(circle, rgba(232,193,95,0.35), rgba(232,193,95,0.02))"
            : "radial-gradient(circle, rgba(139,92,246,0.22), rgba(139,92,246,0.02))",
        }}
      >
        {passed && !reduceMotion && (
          <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {STAR_BURST.map((s, i) => (
              <motion.span
                key={i}
                className="absolute text-sm"
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                animate={{ x: s.x, y: s.y, opacity: [0, 1, 0], scale: [0.4, 1, 0.6] }}
                transition={{ duration: 1, delay: s.delay, ease: "easeOut" }}
              >
                ✨
              </motion.span>
            ))}
          </div>
        )}
        {passed && (
          <motion.span
            aria-hidden
            className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl"
            animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
            transition={reduceMotion ? undefined : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            👑
          </motion.span>
        )}
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-full border bg-navy-900 ${
            passed ? "border-gold-500/50" : "border-purple-400/40"
          }`}
        >
          <span className="text-4xl" aria-hidden>
            {passed ? "✅" : "📖"}
          </span>
        </div>
      </motion.div>

      <motion.h1
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="mt-4 font-display text-2xl font-bold text-[#fbf6e8]"
      >
        {passed ? t.result.headline.levelComplete : t.result.headline.keepStudying}
      </motion.h1>
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        className="mt-1 text-xs text-[#a7aebd]"
      >
        {t.campaign.quizLevel} {result.level}/{MAX_GAME_LEVEL} · {categoryText?.title}
      </motion.div>

      {/* ---------------- stats ---------------- */}
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
        className="mt-6 flex gap-2"
      >
        <StatPill icon="✅" value={`${result.correct}/${result.total}`} label={t.result.correct} tone="success" />
        <StatPill icon="🎯" value={`${pct}%`} label={t.result.accuracy} tone="success" />
        <StatPill icon="⚡" value={`+${result.xpEarned}`} label={t.result.stats.xpEarned} tone="violet" />
        <StatPill icon="🪙" value={`+${result.coinsEarned}`} label={t.result.stats.coinsEarned} tone="gold" />
      </motion.div>

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
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={reduceMotion ? { width: `${player.progressPct}%` } : { width: 0 }}
            animate={{ width: `${player.progressPct}%` }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.8, delay: 0.4 }}
            className="h-full rounded-full bg-gradient-to-r from-purple-400 to-gold-400"
          />
        </div>
      </div>

      {/* ---------------- achievements ---------------- */}
      <div className="mt-4 rounded-[20px] border border-gold-500/20 bg-white/[0.04] p-4">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">{t.achievements.heading}</div>
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-3">
          {ACHIEVEMENTS.map((def) => {
            const text = t.achievements.list[def.id];
            const earned = unlockedAchievements.has(def.id);
            const isNew = newBadgeSet.has(def.id);
            return (
              <div key={def.id} className="relative flex w-[68px] flex-col items-center gap-1 text-center" title={text.description}>
                {isNew && (
                  <span className="absolute -top-1.5 z-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-navy-900">
                    {t.achievements.newTag}
                  </span>
                )}
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full border text-base ${
                    earned ? "border-gold-500/60 bg-gold-500/15 text-gold-300" : "border-white/10 bg-white/[0.03] text-[#525971] grayscale"
                  }`}
                >
                  {def.icon}
                </div>
                <div className={`text-[9px] font-semibold leading-snug ${earned ? "text-[#f3efe2]" : "text-[#666d80]"}`}>{text.title}</div>
              </div>
            );
          })}
        </div>
      </div>

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
            className="flex-1 rounded-full border border-white/20 py-2.5 text-xs font-semibold text-[#c6cbd6] outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {t.result.leaderboardButton}
          </button>
          <button
            onClick={handleShare}
            aria-label={t.result.shareLabel}
            className="flex-1 rounded-full border border-white/20 py-2.5 text-xs font-semibold text-[#c6cbd6] outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
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
