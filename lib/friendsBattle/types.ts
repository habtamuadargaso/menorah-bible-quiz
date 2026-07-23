import type { LangCode } from "@/lib/i18n/locales";
import type { Question, Difficulty } from "@/lib/questions/types";
import type { UIStrings } from "@/lib/i18n/types";

export type { Difficulty };
export const FRIENDS_BATTLE_DEFAULT_DIFFICULTY: Difficulty = "Easy";

/** The UI deliberately labels the "Hard" tier "Difficult" for Friends
 * Battle — the underlying Question.difficulty value stays "Hard" (shared
 * with the rest of the app's question data), only the display label
 * differs here. */
export function friendsBattleDifficultyLabel(t: UIStrings, difficulty: Difficulty): string {
  const tf = t.friendsBattle;
  if (difficulty === "Easy") return tf.difficultyEasy;
  if (difficulty === "Medium") return tf.difficultyMedium;
  return tf.difficultyDifficult;
}

export const FRIENDS_BATTLE_QUESTION_COUNT = 10;
export const FRIENDS_BATTLE_ROUND_SECONDS = 15;
export const FRIENDS_BATTLE_MIN_PLAYERS = 2;
export const FRIENDS_BATTLE_MAX_PLAYERS = 8;
export const FRIENDS_BATTLE_POINTS_CORRECT = 100;

export type FriendsBattlePhase =
  | "setup"
  | "passDevice"
  | "question"
  | "answerSaved"
  | "reveal"
  | "final";

export interface FriendsBattlePlayerState {
  name: string;
  score: number;
  correctCount: number;
}

/** One player's outcome for the question currently in progress. `selectedIndex`
 * is null for a timeout — a timeout is never treated as an answer. */
export interface FriendsBattleAnswer {
  playerIndex: number;
  selectedIndex: number | null;
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface FriendsBattleMatchState {
  phase: FriendsBattlePhase;
  language: LangCode;
  level: number;
  /** Fixed for the entire match once set at START_MATCH/PLAY_AGAIN — never
   * changes mid-match. See lib/friendsBattle/localQuestions.ts for how this
   * is used to filter the question pool. */
  difficulty: Difficulty;
  players: FriendsBattlePlayerState[];
  questions: Question[];
  questionIndex: number;
  currentPlayerIndex: number;
  /** Answers collected so far for `questions[questionIndex]`, one per player, in turn order. */
  answersForCurrentQuestion: FriendsBattleAnswer[];
  /** Every question's completed answer list, once its reveal has happened — used for the final leaderboard breakdown. */
  completedRounds: FriendsBattleAnswer[][];
}

export interface FriendsBattleSetupInput {
  language: LangCode;
  level: number;
  difficulty: Difficulty;
  playerNames: string[];
}
