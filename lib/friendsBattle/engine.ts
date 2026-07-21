import type { Question } from "@/lib/questions";
import {
  FRIENDS_BATTLE_POINTS_CORRECT,
  type Difficulty,
  type FriendsBattleAnswer,
  type FriendsBattleMatchState,
  type FriendsBattlePlayerState,
} from "./types";

export type FriendsBattleAction =
  | {
      type: "START_MATCH";
      language: FriendsBattleMatchState["language"];
      level: number;
      difficulty: Difficulty;
      playerNames: string[];
      questions: Question[];
    }
  | { type: "PLAYER_READY" }
  | { type: "SUBMIT_ANSWER"; selectedIndex: number }
  | { type: "TIMEOUT" }
  | { type: "ADVANCE_AFTER_ANSWER_SAVED" }
  | { type: "CONTINUE_AFTER_REVEAL" }
  | { type: "PLAY_AGAIN"; questions: Question[] }
  | { type: "REHYDRATE"; state: FriendsBattleMatchState };

function scoreAnswer(question: Question, playerIndex: number, selectedIndex: number | null): FriendsBattleAnswer {
  const isCorrect = selectedIndex !== null && selectedIndex === question.correctIndex;
  return {
    playerIndex,
    selectedIndex,
    isCorrect,
    pointsAwarded: isCorrect ? FRIENDS_BATTLE_POINTS_CORRECT : 0,
  };
}

function applyAnswerToPlayers(
  players: FriendsBattlePlayerState[],
  answer: FriendsBattleAnswer
): FriendsBattlePlayerState[] {
  return players.map((p, i) =>
    i === answer.playerIndex
      ? { ...p, score: p.score + answer.pointsAwarded, correctCount: p.correctCount + (answer.isCorrect ? 1 : 0) }
      : p
  );
}

function freshPlayers(names: string[]): FriendsBattlePlayerState[] {
  return names.map((name) => ({ name, score: 0, correctCount: 0 }));
}

export function friendsBattleReducer(
  state: FriendsBattleMatchState,
  action: FriendsBattleAction
): FriendsBattleMatchState {
  switch (action.type) {
    case "START_MATCH":
      return {
        phase: "passDevice",
        language: action.language,
        level: action.level,
        difficulty: action.difficulty,
        players: freshPlayers(action.playerNames),
        questions: action.questions,
        questionIndex: 0,
        currentPlayerIndex: 0,
        answersForCurrentQuestion: [],
        completedRounds: [],
      };

    case "PLAYER_READY":
      if (state.phase !== "passDevice") return state;
      return { ...state, phase: "question" };

    case "SUBMIT_ANSWER":
    case "TIMEOUT": {
      if (state.phase !== "question") return state;
      const question = state.questions[state.questionIndex];
      const selectedIndex = action.type === "SUBMIT_ANSWER" ? action.selectedIndex : null;
      const answer = scoreAnswer(question, state.currentPlayerIndex, selectedIndex);
      return {
        ...state,
        phase: "answerSaved",
        players: applyAnswerToPlayers(state.players, answer),
        answersForCurrentQuestion: [...state.answersForCurrentQuestion, answer],
      };
    }

    case "ADVANCE_AFTER_ANSWER_SAVED": {
      if (state.phase !== "answerSaved") return state;
      const everyoneAnswered = state.answersForCurrentQuestion.length >= state.players.length;
      if (everyoneAnswered) {
        return { ...state, phase: "reveal" };
      }
      return {
        ...state,
        phase: "passDevice",
        currentPlayerIndex: state.currentPlayerIndex + 1,
      };
    }

    case "CONTINUE_AFTER_REVEAL": {
      if (state.phase !== "reveal") return state;
      const completedRounds = [...state.completedRounds, state.answersForCurrentQuestion];
      const nextQuestionIndex = state.questionIndex + 1;
      if (nextQuestionIndex >= state.questions.length) {
        return { ...state, phase: "final", completedRounds };
      }
      return {
        ...state,
        phase: "passDevice",
        questionIndex: nextQuestionIndex,
        currentPlayerIndex: 0,
        answersForCurrentQuestion: [],
        completedRounds,
      };
    }

    case "PLAY_AGAIN":
      return {
        phase: "passDevice",
        language: state.language,
        level: state.level,
        difficulty: state.difficulty,
        players: freshPlayers(state.players.map((p) => p.name)),
        questions: action.questions,
        questionIndex: 0,
        currentPlayerIndex: 0,
        answersForCurrentQuestion: [],
        completedRounds: [],
      };

    case "REHYDRATE":
      return action.state;

    default:
      return state;
  }
}
