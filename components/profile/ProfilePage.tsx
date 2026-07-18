"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, type Target, type Transition } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { loadProgress, levelForXp, type Progress } from "@/lib/progress";
import { ACHIEVEMENTS, loadUnlockedAchievements, type AchievementId } from "@/lib/achievements";
import { CATEGORIES } from "@/lib/categories";
import { loadProfileStats, DAILY_GOAL_QUESTIONS, DAILY_GOAL_XP, type ProfileStats } from "@/lib/profileStats";
import StatTile from "./StatTile";
import AchievementBadge from "./AchievementBadge";
import CircularGoalRing from "./CircularGoalRing";
import CategoryCard from "./CategoryCard";

export default function ProfilePage({
  onCategories,
  onLeaderboard,
}: {
  onCategories: () => void;
  onLeaderboard: () => void;
}) {
  const { t, lang } = useLanguage();
  const reduceMotion = useReducedMotion();
  const { user, isGuest } = useAuth();
  const displayName = user?.displayName ?? t.common.guest;

  const [progress, setProgress] = useState<Progress>({ totalXp: 0, coins: 0, quizzesCompleted: 0 });
  const [unlocked, setUnlocked] = useState<AchievementId[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProgress(loadProgress());
    setUnlocked(loadUnlockedAchievements());
    setStats(loadProfileStats());
  }, []);

  // Fade/slide entrance helper — collapses to an opacity-only fade under
  // reduced motion, matching the pattern established in ResultCard.tsx.
  function entrance(delay = 0, opts: { y?: number; scale?: number } = {}): {
    initial: Target;
    animate: Target;
    transition: Transition;
  } {
    if (reduceMotion) {
      return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2, delay } };
    }
    const { y = 0, scale } = opts;
    return {
      initial: { opacity: 0, y, scale },
      animate: { opacity: 1, y: 0, scale: scale !== undefined ? 1 : undefined },
      transition: { duration: 0.4, delay, ease: "easeOut" },
    };
  }

  const { level, xpIntoLevel, xpForNextLevel, progressPct } = levelForXp(progress.totalXp);
  const accuracyPct = stats && stats.questionsAnswered > 0 ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100) : 0;
  const questionsGoalPct = stats ? Math.min(100, (stats.dailyQuestionsToday / DAILY_GOAL_QUESTIONS) * 100) : 0;
  const xpGoalPct = stats ? Math.min(100, (stats.dailyXpToday / DAILY_GOAL_XP) * 100) : 0;
  const dailyGoalComplete = questionsGoalPct >= 100 && xpGoalPct >= 100;

  const topCategories = useMemo(() => {
    if (!stats) return [];
    return [...CATEGORIES]
      .map((c) => ({ ...c, plays: stats.categoryPlays[c.id] ?? 0 }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 6);
  }, [stats]);

  const hasPlayedAnyCategory = topCategories.some((c) => c.plays > 0);

  function scrollToStats() {
    statsRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  if (!stats) {
    // First client paint only — avoids a localStorage/SSR flash of zeros.
    return <section id="profile" className="mx-auto max-w-4xl px-5 py-24" />;
  }

  return (
    <section id="profile" className="relative mx-auto max-w-4xl overflow-hidden px-5 pb-24 pt-6">
      {/* ambient backdrop — matches Sprint 1 / Sprint 2 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl"
          animate={reduceMotion ? undefined : { opacity: [0.5, 0.9, 0.5], scale: [1, 1.08, 1] }}
          transition={reduceMotion ? undefined : { duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-20 top-72 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl"
          animate={reduceMotion ? undefined : { opacity: [0.4, 0.8, 0.4], scale: [1.05, 0.95, 1.05] }}
          transition={reduceMotion ? undefined : { duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />
      </div>

      {/* ---------------- Section 1: hero profile ---------------- */}
      <motion.div
        {...entrance(0, { y: -14, scale: 0.97 })}
        className="rounded-card border border-gold-500/25 bg-glass-gold p-6 text-center shadow-premium-lg backdrop-blur-md sm:p-9"
      >
        <motion.div
          animate={reduceMotion ? undefined : { boxShadow: ["0 0 20px rgba(232,193,95,0.25)", "0 0 34px rgba(232,193,95,0.45)", "0 0 20px rgba(232,193,95,0.25)"] }}
          transition={reduceMotion ? undefined : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-gold-500/50 bg-navy-900 font-display text-4xl font-bold text-gold-400 sm:h-28 sm:w-28"
        >
          {displayName.charAt(0).toUpperCase()}
        </motion.div>
        <div className="mt-4 font-display text-2xl font-bold text-[#fbf6e8] sm:text-3xl">
          {isGuest ? t.common.guest : displayName}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-200">
            {t.common.level} {level}
          </span>
          <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-bold text-gold-300">
            ⚡ {progress.totalXp} {t.common.xp}
          </span>
        </div>
        <p className="mt-4 text-sm italic text-[#c6cbd6]">{t.profile.heroTagline}</p>
      </motion.div>

      {/* ---------------- Section 2: XP progress ---------------- */}
      <motion.div
        {...entrance(0.15, { y: 18 })}
        className="mt-5 rounded-[22px] border border-purple-400/25 bg-glass-purple p-5 text-left shadow-premium backdrop-blur-md sm:p-7"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">{t.profile.xpProgressHeading}</div>
          <div className="font-display text-lg font-bold text-[#fbf6e8]">{t.common.level} {level}</div>
        </div>
        <div className="mt-4 flex justify-between text-xs text-[#9aa1b0]" id="profile-xp-label">
          <span>{xpIntoLevel} / {xpForNextLevel} {t.common.xp}</span>
          <span>{progressPct}%</span>
        </div>
        <div
          role="progressbar"
          aria-labelledby="profile-xp-label"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/10"
        >
          <motion.div
            initial={reduceMotion ? { width: `${progressPct}%` } : { width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-purple-400 to-gold-400"
          />
        </div>
      </motion.div>

      {/* ---------------- Section 3: player statistics ---------------- */}
      <motion.div
        ref={statsRef}
        {...entrance(0.2, { y: 18 })}
        className="mt-5 scroll-mt-6 rounded-card border border-gold-500/20 bg-white/[0.04] p-5 shadow-premium-lg sm:p-7"
      >
        <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{t.profile.statsHeading}</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon="🎮" label={t.profile.totalGames} value={progress.quizzesCompleted} tone="neutral" delay={0.24} />
          <StatTile icon="❓" label={t.profile.questionsAnswered} value={stats.questionsAnswered} tone="purple" delay={0.28} />
          <StatTile icon="✅" label={t.profile.correctAnswers} value={stats.correctAnswers} tone="emerald" delay={0.32} />
          <StatTile icon="🎯" label={t.result.accuracy} value={accuracyPct} suffix="%" tone="gold" delay={0.36} />
          <StatTile icon="🏆" label={t.profile.longestStreak} value={stats.longestDayStreak} tone="gold" delay={0.4} />
          <StatTile icon="🔥" label={t.profile.currentStreak} value={stats.currentDayStreak} tone="neutral" delay={0.44} />
          <StatTile icon="⚡" label={t.profile.totalXp} value={progress.totalXp} tone="gold" delay={0.48} />
          <StatTile icon="🪙" label={t.profile.totalCoins} value={progress.coins} tone="purple" delay={0.52} />
        </div>
      </motion.div>

      {/* ---------------- Section 4: achievements ---------------- */}
      <motion.div
        {...entrance(0.3, { y: 18 })}
        className="mt-5 rounded-[22px] border border-gold-500/20 bg-white/[0.04] p-5 shadow-premium"
      >
        <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{t.profile.badgesHeading}</div>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-4">
          {ACHIEVEMENTS.map((def, i) => {
            const text = t.achievements.list[def.id];
            return (
              <AchievementBadge
                key={def.id}
                icon={def.icon}
                title={text.title}
                description={text.description}
                earned={unlocked.includes(def.id)}
                delay={0.34 + i * 0.05}
              />
            );
          })}
        </div>
      </motion.div>

      {/* ---------------- Section 5: daily goal ---------------- */}
      <motion.div
        {...entrance(0.4, { y: 18 })}
        className="mt-5 rounded-[22px] border border-gold-500/20 bg-glass-gold p-5 shadow-premium sm:p-7"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{t.profile.dailyGoalHeading}</div>
          {dailyGoalComplete && (
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
              {t.profile.dailyGoalComplete}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <CircularGoalRing
            pct={questionsGoalPct}
            color="#e8c15f"
            label={t.profile.dailyGoalQuestionsLabel}
            valueText={`${stats.dailyQuestionsToday} / ${DAILY_GOAL_QUESTIONS}`}
            delay={0.5}
          />
          <CircularGoalRing
            pct={xpGoalPct}
            color="#a78bfa"
            label={t.profile.dailyGoalXpLabel}
            valueText={`${stats.dailyXpToday} / ${DAILY_GOAL_XP}`}
            delay={0.6}
          />
        </div>
      </motion.div>

      {/* ---------------- Section 6: recent activity ---------------- */}
      <motion.div
        {...entrance(0.5, { y: 18 })}
        className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.04] p-5 shadow-premium sm:p-7"
      >
        <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-purple-300">{t.profile.recentActivityHeading}</div>
        {stats.recentActivity.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-[#8d94a3]">
            {t.profile.recentActivityEmpty}
          </div>
        ) : (
          <ol className="relative flex flex-col gap-4 border-l border-white/10 pl-5">
            {stats.recentActivity.map((entry, i) => {
              const categoryText = t.categories[entry.categoryId];
              const dateLabel = new Date(entry.date).toLocaleDateString(lang === "am" ? "am-ET" : undefined, {
                month: "short",
                day: "numeric",
              });
              return (
                <motion.li
                  key={`${entry.date}-${i}`}
                  {...entrance(0.55 + i * 0.05, { y: 10 })}
                  className="relative"
                >
                  <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-gold-500 shadow-[0_0_8px_rgba(232,193,95,0.6)]" aria-hidden />
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="text-sm font-semibold text-[#f3efe2]">{categoryText?.title}</span>
                    <span className="text-xs text-[#8d94a3]">{dateLabel}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-[#9aa1b0]">
                    <span>{entry.correct}/{entry.total} {t.result.correct.toLowerCase()}</span>
                    <span aria-hidden>&middot;</span>
                    <span className="text-gold-400">+{entry.xpEarned} {t.common.xp}</span>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
      </motion.div>

      {/* ---------------- Section 7: favorite categories ---------------- */}
      <motion.div
        {...entrance(0.55, { y: 18 })}
        className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.04] p-5 shadow-premium sm:p-7"
      >
        <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{t.profile.favoriteCategoriesHeading}</div>
        {!hasPlayedAnyCategory ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-[#8d94a3]">
            <p>{t.profile.favoriteCategoriesEmpty}</p>
            <button
              onClick={onCategories}
              className="mt-3 rounded-full border border-gold-500/45 px-5 py-2 text-xs font-bold text-gold-300 outline-none transition-colors hover:bg-gold-500/10 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
            >
              {t.nav.categories}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {topCategories.map((c, i) => {
              const text = t.categories[c.id];
              return (
                <CategoryCard
                  key={c.id}
                  icon={c.icon}
                  title={text?.title ?? c.id}
                  playsLabel={t.profile.timesPlayed.replace("{count}", String(c.plays))}
                  rank={i + 1}
                  delay={0.6 + i * 0.05}
                />
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ---------------- Section 8: profile actions ---------------- */}
      <motion.div {...entrance(0.65, { y: 14 })} className="mt-6">
        <div className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#8d94a3]">
          {t.profile.actionsHeading}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <motion.button
            whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            aria-disabled="true"
            aria-label={`${t.profile.editProfile} — ${t.common.comingSoon}`}
            className="relative rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-[#c6cbd6] opacity-70 outline-none shadow-premium transition-colors focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            ✏️ {t.profile.editProfile}
          </motion.button>
          <motion.button
            whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            aria-disabled="true"
            aria-label={`${t.profile.settings} — ${t.common.comingSoon}`}
            className="relative rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-[#c6cbd6] opacity-70 outline-none shadow-premium transition-colors focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            ⚙️ {t.profile.settings}
          </motion.button>
          <motion.button
            onClick={onLeaderboard}
            whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className="rounded-full border border-gold-500/45 bg-gold-500/10 px-5 py-3 text-sm font-bold text-gold-300 outline-none shadow-gold transition-colors hover:bg-gold-500/20 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            🏆 {t.nav.leaderboard}
          </motion.button>
          <motion.button
            whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            aria-disabled="true"
            aria-label={`${t.profile.friends} — ${t.common.comingSoon}`}
            className="relative rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-[#c6cbd6] opacity-70 outline-none shadow-premium transition-colors focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            👥 {t.profile.friends}
          </motion.button>
          <motion.button
            onClick={scrollToStats}
            whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className="rounded-full border border-purple-400/45 bg-purple-500/10 px-5 py-3 text-sm font-bold text-purple-200 outline-none shadow-purple transition-colors hover:bg-purple-500/20 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            📊 {t.profile.statisticsAction}
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}
