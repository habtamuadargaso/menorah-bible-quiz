export interface ScoreEntry {
  name: string;
  categoryTitle: string;
  score: number;
  correct: number;
  total: number;
  date: string; // ISO string
  difficulty?: "Easy" | "Medium" | "Hard";
  xpEarned?: number;
}

const STORAGE_KEY = "menorah-bible-quiz-leaderboard";

export function loadLeaderboard(): ScoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ScoreEntry[];
  } catch {
    return [];
  }
}

export function saveScore(entry: ScoreEntry): ScoreEntry[] {
  const current = loadLeaderboard();
  const next = [...current, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}
