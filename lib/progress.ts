// Player progress: XP, coins, player level, and lifetime quiz count.
// Stored in localStorage only — no backend. Future login can sync this object.

const STORAGE_KEY = "menorah-bible-quiz-progress";
export const XP_PER_LEVEL = 500;

export interface Progress {
  totalXp: number;
  coins: number;
  quizzesCompleted: number;
}

export interface ProgressUpdate {
  progress: Progress;
  previousLevel: number;
  currentLevel: number;
  leveledUp: boolean;
}

const DEFAULT_PROGRESS: Progress = { totalXp: 0, coins: 0, quizzesCompleted: 0 };

function normalizeProgress(value: unknown): Progress {
  const parsed = value && typeof value === "object" ? (value as Partial<Progress>) : {};
  return {
    totalXp: typeof parsed.totalXp === "number" ? Math.max(0, parsed.totalXp) : 0,
    coins: typeof parsed.coins === "number" ? Math.max(0, parsed.coins) : 0,
    quizzesCompleted: typeof parsed.quizzesCompleted === "number" ? Math.max(0, parsed.quizzesCompleted) : 0,
  };
}

export function loadProgress(): Progress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    return normalizeProgress(JSON.parse(raw));
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function saveProgress(progress: Progress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore write failures (e.g. private browsing)
  }
}

export function addQuizRewards(xpEarned: number, coinsEarned: number): ProgressUpdate {
  const current = loadProgress();
  const previousLevel = levelForXp(current.totalXp).level;
  const next: Progress = {
    totalXp: current.totalXp + Math.max(0, xpEarned),
    coins: current.coins + Math.max(0, coinsEarned),
    quizzesCompleted: current.quizzesCompleted + 1,
  };
  saveProgress(next);
  const currentLevel = levelForXp(next.totalXp).level;
  return { progress: next, previousLevel, currentLevel, leveledUp: currentLevel > previousLevel };
}

// Backward-compatible helper used by older components if needed.
export function addXpAndQuiz(xpEarned: number): Progress {
  return addQuizRewards(xpEarned, 0).progress;
}

export function addDailyReward(xp: number, coins: number): ProgressUpdate {
  const current = loadProgress();
  const previousLevel = levelForXp(current.totalXp).level;
  const next: Progress = {
    ...current,
    totalXp: current.totalXp + Math.max(0, xp),
    coins: current.coins + Math.max(0, coins),
  };
  saveProgress(next);
  const currentLevel = levelForXp(next.totalXp).level;
  return { progress: next, previousLevel, currentLevel, leveledUp: currentLevel > previousLevel };
}

export function levelForXp(totalXp: number) {
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = totalXp % XP_PER_LEVEL;
  const progressPct = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100);
  return { level, xpIntoLevel, xpForNextLevel: XP_PER_LEVEL, progressPct };
}
