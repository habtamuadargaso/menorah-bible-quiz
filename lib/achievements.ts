export type AchievementId =
  | "first_quiz"
  | "perfect_score"
  | "on_fire"
  | "hard_mode"
  | "five_quizzes"
  | "polyglot";

export interface AchievementDef {
  id: AchievementId;
  icon: string; // single glyph/letter shown in the badge circle
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_quiz", icon: "1" },
  { id: "perfect_score", icon: "★" },
  { id: "on_fire", icon: "⚡" },
  { id: "hard_mode", icon: "5" },
  { id: "five_quizzes", icon: "📖" },
  { id: "polyglot", icon: "10" },
];

const STORAGE_KEY = "menorah-bible-quiz-achievements";

export function loadUnlockedAchievements(): AchievementId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AchievementId[]) : [];
  } catch {
    return [];
  }
}

function persistUnlocked(ids: AchievementId[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore write failures
  }
}

export interface AchievementCheckContext {
  correct: number;
  total: number;
  bestStreak: number;
  difficulty: "Easy" | "Medium" | "Hard";
  lang: string;
  fastAnswers?: number;
  playerLevel?: number;
  totalQuizzesCompleted: number; // count AFTER this quiz
}

/**
 * Evaluates which achievements are newly unlocked given the latest quiz
 * result, persists the full unlocked set, and returns just the
 * newly-unlocked ids (so the result screen can show a "New Badge!" pop-in).
 */
export function checkAchievements(ctx: AchievementCheckContext): AchievementId[] {
  const already = new Set(loadUnlockedAchievements());
  const newly: AchievementId[] = [];

  function unlock(id: AchievementId) {
    if (!already.has(id)) {
      already.add(id);
      newly.push(id);
    }
  }

  if (ctx.totalQuizzesCompleted >= 1) unlock("first_quiz");
  if (ctx.total > 0 && ctx.correct === ctx.total) unlock("perfect_score");
  if ((ctx.fastAnswers ?? 0) >= 5 || ctx.bestStreak >= 5) unlock("on_fire");
  if ((ctx.playerLevel ?? 1) >= 5) unlock("hard_mode");
  if (ctx.totalQuizzesCompleted >= 5) unlock("five_quizzes");
  if ((ctx.playerLevel ?? 1) >= 10) unlock("polyglot");

  persistUnlocked([...already]);
  return newly;
}
