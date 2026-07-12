import type { Difficulty } from "./questions/types";

export const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

export const DIFFICULTY_CONFIG: Record<Difficulty, { timePerQuestion: number; xpPerCorrect: number }> = {
  Easy: { timePerQuestion: 15, xpPerCorrect: 10 },
  Medium: { timePerQuestion: 15, xpPerCorrect: 20 },
  Hard: { timePerQuestion: 15, xpPerCorrect: 30 },
};
