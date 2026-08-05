import type { Question } from "@/lib/questions";
import { FRIENDS_BATTLE_POINTS_CORRECT } from "@/lib/friendsBattle/types";

export interface ChurchPlayer {
  id: string;
  name: string;
  ready: boolean;
  score: number;
  correctCount: number;
}

export interface ChurchAnswerResult {
  playerId: string;
  selectedIndex: number | null;
  isCorrect: boolean;
  pointsAwarded: number;
}

export type ChurchMatchPhase = "lobby" | "handoff" | "answering" | "reveal" | "results";

export interface ChurchMatchState {
  phase: ChurchMatchPhase;
  players: ChurchPlayer[];
  questions: Question[];
  questionIndex: number;
  currentPlayerIndex: number;
  answers: Record<string, ChurchAnswerResult>;
  timeLeft: number;
  secondsPerQuestion: number;
}

export type StartMatchResult =
  | { ok: true; state: ChurchMatchState }
  | { ok: false; reason: "NOT_ENOUGH_PLAYERS" | "PLAYERS_NOT_READY" | "NO_QUESTIONS" };

export function startChurchMatch(
  players: ChurchPlayer[],
  questions: Question[],
  secondsPerQuestion: number,
): StartMatchResult {
  if (players.length < 2) return { ok: false, reason: "NOT_ENOUGH_PLAYERS" };
  if (players.some((player) => !player.ready)) return { ok: false, reason: "PLAYERS_NOT_READY" };
  if (questions.length === 0) return { ok: false, reason: "NO_QUESTIONS" };

  return {
    ok: true,
    state: {
      phase: "handoff",
      players: players.map((player) => ({ ...player, score: 0, correctCount: 0 })),
      questions,
      questionIndex: 0,
      currentPlayerIndex: 0,
      answers: {},
      timeLeft: secondsPerQuestion,
      secondsPerQuestion,
    },
  };
}

/** Begins exactly one participant turn. Calling this again while already
 * answering is a no-op, so rapid taps cannot restart the countdown. */
export function startChurchTurn(state: ChurchMatchState): ChurchMatchState {
  if (state.phase !== "handoff") return state;
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || state.answers[currentPlayer.id]) return state;
  return { ...state, phase: "answering", timeLeft: state.secondsPerQuestion };
}

export function applyChurchAnswer(
  players: ChurchPlayer[],
  playerId: string,
  question: Question,
  selectedIndex: number | null,
): { players: ChurchPlayer[]; result: ChurchAnswerResult } {
  const isCorrect = selectedIndex === question.correctIndex;
  const pointsAwarded = isCorrect ? FRIENDS_BATTLE_POINTS_CORRECT : 0;

  return {
    players: players.map((player) =>
      player.id === playerId
        ? {
            ...player,
            score: player.score + pointsAwarded,
            correctCount: player.correctCount + (isCorrect ? 1 : 0),
          }
        : player,
    ),
    result: { playerId, selectedIndex, isCorrect, pointsAwarded },
  };
}

export function recordChurchAnswer(
  state: ChurchMatchState,
  playerId: string,
  selectedIndex: number,
): ChurchMatchState {
  if (state.phase !== "answering" || state.answers[playerId]) return state;
  const question = state.questions[state.questionIndex];
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!question || !currentPlayer || currentPlayer.id !== playerId) return state;

  const outcome = applyChurchAnswer(state.players, playerId, question, selectedIndex);
  const answers = { ...state.answers, [playerId]: outcome.result };
  const allAnswered = Object.keys(answers).length === state.players.length;
  const nextPlayerIndex = allAnswered
    ? state.currentPlayerIndex
    : state.players.findIndex((player) => !answers[player.id]);

  return {
    ...state,
    phase: allAnswered ? "reveal" : "handoff",
    players: outcome.players,
    answers,
    currentPlayerIndex: nextPlayerIndex,
    // The configured duration belongs to each participant, not the whole
    // question. Stop at reveal; otherwise start the next turn at full time.
    timeLeft: allAnswered ? 0 : state.secondsPerQuestion,
  };
}

export function resolveChurchTimeout(state: ChurchMatchState): ChurchMatchState {
  if (state.phase !== "answering") return state;
  const question = state.questions[state.questionIndex];
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!question || !currentPlayer || state.answers[currentPlayer.id]) return state;

  // A timeout belongs only to the active participant. Previous answers stay
  // intact and later participants still receive their complete turn.
  const outcome = applyChurchAnswer(state.players, currentPlayer.id, question, null);
  const answers = { ...state.answers, [currentPlayer.id]: outcome.result };
  const allAnswered = Object.keys(answers).length === state.players.length;
  const nextPlayerIndex = allAnswered
    ? state.currentPlayerIndex
    : state.players.findIndex((player) => !answers[player.id]);

  return {
    ...state,
    phase: allAnswered ? "reveal" : "handoff",
    players: outcome.players,
    answers,
    currentPlayerIndex: nextPlayerIndex,
    timeLeft: allAnswered ? 0 : state.secondsPerQuestion,
  };
}

/** One deterministic timer tick. The UI passes `paused=true` while the quit
 * dialog is open, which preserves the exact remaining time for resume. */
export function tickChurchTimer(state: ChurchMatchState, paused = false): ChurchMatchState {
  if (paused || state.phase !== "answering" || state.timeLeft <= 0) return state;
  return { ...state, timeLeft: state.timeLeft - 1 };
}

export function advanceChurchQuestion(state: ChurchMatchState): ChurchMatchState {
  if (state.phase !== "reveal") return state;
  if (state.questionIndex >= state.questions.length - 1) {
    return { ...state, phase: "results" };
  }
  return {
    ...state,
    phase: "handoff",
    questionIndex: state.questionIndex + 1,
    currentPlayerIndex: 0,
    answers: {},
    timeLeft: state.secondsPerQuestion,
  };
}

export function replayChurchMatch(state: ChurchMatchState, questions = state.questions): ChurchMatchState {
  return {
    ...state,
    phase: "handoff",
    players: state.players.map((player) => ({ ...player, score: 0, correctCount: 0 })),
    questions,
    questionIndex: 0,
    currentPlayerIndex: 0,
    answers: {},
    timeLeft: state.secondsPerQuestion,
  };
}

export function resetChurchMatch(secondsPerQuestion: number): ChurchMatchState {
  return {
    phase: "lobby",
    players: [],
    questions: [],
    questionIndex: 0,
    currentPlayerIndex: 0,
    answers: {},
    timeLeft: secondsPerQuestion,
    secondsPerQuestion,
  };
}

export function rankChurchPlayers(players: ChurchPlayer[]): ChurchPlayer[] {
  return [...players].sort(
    (left, right) =>
      right.score - left.score ||
      right.correctCount - left.correctCount ||
      left.name.localeCompare(right.name),
  );
}

export function getChurchAccuracy(correctCount: number, questionCount: number): number {
  if (questionCount <= 0) return 0;
  return Math.round((correctCount / questionCount) * 100);
}
