// Player-facing profile/progression stats: cumulative questions answered,
// correct answers, per-category play counts, a short recent-activity log,
// a day-streak, and today's daily-goal counters.
//
// This is intentionally a NEW, additive store — it does not read or write
// lib/progress.ts, lib/leaderboard.ts, lib/campaign.ts, or lib/achievements.ts,
// and it does not change any XP/coin/campaign/achievement calculation. It
// only mirrors a few extra numbers, purely for the Profile screen, that
// nothing else in the app currently tracks.

import type { CategoryId } from "@/lib/categories";

const STORAGE_KEY = "menorah-bible-quiz-profile-stats";
const RECENT_ACTIVITY_LIMIT = 8;

export const DAILY_GOAL_QUESTIONS = 20;
export const DAILY_GOAL_XP = 200;

export interface RecentActivityEntry {
  categoryId: CategoryId;
  correct: number;
  total: number;
  xpEarned: number;
  date: string; // ISO timestamp
}

interface StoredProfileStats {
  questionsAnswered: number;
  correctAnswers: number;
  categoryPlays: Partial<Record<CategoryId, number>>;
  recentActivity: RecentActivityEntry[];
  lastPlayedDate: string | null; // YYYY-MM-DD, local calendar day
  currentDayStreak: number;
  longestDayStreak: number;
  dailyGoalDate: string | null; // YYYY-MM-DD the counters below apply to
  dailyQuestionsToday: number;
  dailyXpToday: number;
}

export interface ProfileStats {
  questionsAnswered: number;
  correctAnswers: number;
  categoryPlays: Partial<Record<CategoryId, number>>;
  recentActivity: RecentActivityEntry[];
  longestDayStreak: number;
  /** 0 once the streak has lapsed (no play today or yesterday). */
  currentDayStreak: number;
  /** 0 unless today already has recorded activity. */
  dailyQuestionsToday: number;
  /** 0 unless today already has recorded activity. */
  dailyXpToday: number;
}

const DEFAULT_STATS: StoredProfileStats = {
  questionsAnswered: 0,
  correctAnswers: 0,
  categoryPlays: {},
  recentActivity: [],
  lastPlayedDate: null,
  currentDayStreak: 0,
  longestDayStreak: 0,
  dailyGoalDate: null,
  dailyQuestionsToday: 0,
  dailyXpToday: 0,
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isImmediatelyBefore(earlierKey: string, laterKey: string): boolean {
  const [y, m, d] = earlierKey.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  const nextKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
  return nextKey === laterKey;
}

function normalize(value: unknown): StoredProfileStats {
  const parsed = value && typeof value === "object" ? (value as Partial<StoredProfileStats>) : {};
  return {
    questionsAnswered: typeof parsed.questionsAnswered === "number" ? Math.max(0, parsed.questionsAnswered) : 0,
    correctAnswers: typeof parsed.correctAnswers === "number" ? Math.max(0, parsed.correctAnswers) : 0,
    categoryPlays:
      parsed.categoryPlays && typeof parsed.categoryPlays === "object" && !Array.isArray(parsed.categoryPlays)
        ? parsed.categoryPlays
        : {},
    recentActivity: Array.isArray(parsed.recentActivity) ? parsed.recentActivity.slice(0, RECENT_ACTIVITY_LIMIT) : [],
    lastPlayedDate: typeof parsed.lastPlayedDate === "string" ? parsed.lastPlayedDate : null,
    currentDayStreak: typeof parsed.currentDayStreak === "number" ? Math.max(0, parsed.currentDayStreak) : 0,
    longestDayStreak: typeof parsed.longestDayStreak === "number" ? Math.max(0, parsed.longestDayStreak) : 0,
    dailyGoalDate: typeof parsed.dailyGoalDate === "string" ? parsed.dailyGoalDate : null,
    dailyQuestionsToday: typeof parsed.dailyQuestionsToday === "number" ? Math.max(0, parsed.dailyQuestionsToday) : 0,
    dailyXpToday: typeof parsed.dailyXpToday === "number" ? Math.max(0, parsed.dailyXpToday) : 0,
  };
}

function readRaw(): StoredProfileStats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    return normalize(JSON.parse(raw));
  } catch {
    return DEFAULT_STATS;
  }
}

function persist(stats: StoredProfileStats) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore write failures (e.g. private browsing)
  }
}

/** Read-only — never mutates storage. Safe to call anytime the Profile screen renders. */
export function loadProfileStats(): ProfileStats {
  const raw = readRaw();
  const today = todayKey();
  const streakAlive = raw.lastPlayedDate === today || (raw.lastPlayedDate !== null && isImmediatelyBefore(raw.lastPlayedDate, today));
  const goalIsToday = raw.dailyGoalDate === today;
  return {
    questionsAnswered: raw.questionsAnswered,
    correctAnswers: raw.correctAnswers,
    categoryPlays: raw.categoryPlays,
    recentActivity: raw.recentActivity,
    longestDayStreak: raw.longestDayStreak,
    currentDayStreak: streakAlive ? raw.currentDayStreak : 0,
    dailyQuestionsToday: goalIsToday ? raw.dailyQuestionsToday : 0,
    dailyXpToday: goalIsToday ? raw.dailyXpToday : 0,
  };
}

/**
 * Called once per finished quiz (from the same place app/page.tsx already
 * applies XP/coin rewards) to mirror a few extra numbers for the Profile
 * screen. Never touches progress/leaderboard/campaign/achievement state.
 */
export function recordCompletedQuiz(result: {
  categoryId: CategoryId;
  correct: number;
  total: number;
  xpEarned: number;
}): void {
  const raw = readRaw();
  const today = todayKey();

  const nextCategoryPlays = { ...raw.categoryPlays };
  nextCategoryPlays[result.categoryId] = (nextCategoryPlays[result.categoryId] ?? 0) + 1;

  const nextActivity: RecentActivityEntry[] = [
    { categoryId: result.categoryId, correct: result.correct, total: result.total, xpEarned: result.xpEarned, date: new Date().toISOString() },
    ...raw.recentActivity,
  ].slice(0, RECENT_ACTIVITY_LIMIT);

  let nextCurrentStreak: number;
  if (raw.lastPlayedDate === today) {
    nextCurrentStreak = Math.max(1, raw.currentDayStreak);
  } else if (raw.lastPlayedDate !== null && isImmediatelyBefore(raw.lastPlayedDate, today)) {
    nextCurrentStreak = raw.currentDayStreak + 1;
  } else {
    nextCurrentStreak = 1;
  }

  const goalIsToday = raw.dailyGoalDate === today;

  persist({
    questionsAnswered: raw.questionsAnswered + result.total,
    correctAnswers: raw.correctAnswers + result.correct,
    categoryPlays: nextCategoryPlays,
    recentActivity: nextActivity,
    lastPlayedDate: today,
    currentDayStreak: nextCurrentStreak,
    longestDayStreak: Math.max(raw.longestDayStreak, nextCurrentStreak),
    dailyGoalDate: today,
    dailyQuestionsToday: (goalIsToday ? raw.dailyQuestionsToday : 0) + result.total,
    dailyXpToday: (goalIsToday ? raw.dailyXpToday : 0) + result.xpEarned,
  });
}
