import type { Difficulty } from "./questions/types";

export const MAX_GAME_LEVEL = 10;
export const QUESTIONS_PER_LEVEL = 10;

export function difficultyForLevel(level: number): Difficulty {
  if (level <= 3) return "Easy";
  if (level <= 7) return "Medium";
  return "Hard";
}

export function levelTitle(level: number) {
  if (level <= 3) return "Foundation";
  if (level <= 7) return "Growing Disciple";
  return "Scripture Master";
}

export function levelPassMessage(level: number) {
  if (level >= MAX_GAME_LEVEL) return "You completed all 10 levels!";
  return `Level ${level + 1} unlocked`;
}
