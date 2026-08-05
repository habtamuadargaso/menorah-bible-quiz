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

export type ChurchMatchPhase = "lobby" | "question" | "reveal" | "results";

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
      phase: "question",
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
  if (state.phase !== "question" || state.answers[playerId]) return state;
  const question = state.questions[state.questionIndex];
  if (!question || !state.players.some((player) => player.id === playerId)) return state;

  const outcome = applyChurchAnswer(state.players, playerId, question, selectedIndex);
  const answers = { ...state.answers, [playerId]: outcome.result };
  const allAnswered = Object.keys(answers).length === state.players.length;
  const nextPlayerIndex = allAnswered
    ? state.currentPlayerIndex
    : state.players.findIndex((player) => !answers[player.id]);

  return {
    ...state,
    phase: allAnswered ? "reveal" : "question",
    players: outcome.players,
    answers,
    currentPlayerIndex: nextPlayerIndex,
  };
}

export function resolveChurchTimeout(state: ChurchMatchState): ChurchMatchState {
  if (state.phase !== "question") return state;
  const question = state.questions[state.questionIndex];
  if (!question) return state;

  let players = state.players;
  const answers = { ...state.answers };
  state.players.forEach((player) => {
    if (answers[player.id]) return;
    const outcome = applyChurchAnswer(players, player.id, question, null);
    players = outcome.players;
    answers[player.id] = outcome.result;
  });

  return { ...state, phase: "reveal", players, answers, timeLeft: 0 };
}

export function advanceChurchQuestion(state: ChurchMatchState): ChurchMatchState {
  if (state.phase !== "reveal") return state;
  if (state.questionIndex >= state.questions.length - 1) {
    return { ...state, phase: "results" };
  }
  return {
    ...state,
    phase: "question",
    questionIndex: state.questionIndex + 1,
    currentPlayerIndex: 0,
    answers: {},
    timeLeft: state.secondsPerQuestion,
  };
}

export function replayChurchMatch(state: ChurchMatchState, questions = state.questions): ChurchMatchState {
  return {
    ...state,
    phase: "lobby",
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
