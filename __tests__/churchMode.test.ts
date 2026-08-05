import { describe, expect, it } from "vitest";
import {
  applyChurchAnswer,
  advanceChurchQuestion,
  getChurchAccuracy,
  rankChurchPlayers,
  recordChurchAnswer,
  replayChurchMatch,
  resetChurchMatch,
  resolveChurchTimeout,
  startChurchMatch,
  type ChurchMatchState,
  type ChurchPlayer,
} from "@/lib/churchMode/engine";
import type { Question } from "@/lib/questions";

const question: Question = {
  id: "church-test",
  categoryId: "general",
  question: "Test question?",
  choices: ["First", "Second", "Third", "Fourth"],
  correctIndex: 1,
  reference: "Test 1:1",
  explanation: "Test explanation",
  difficulty: "Medium",
};

const players: ChurchPlayer[] = [
  { id: "a", name: "Ada", ready: true, score: 0, correctCount: 0 },
  { id: "b", name: "Ben", ready: true, score: 0, correctCount: 0 },
];

const secondQuestion = { ...question, id: "church-test-2", correctIndex: 0 as const };

function startedState(): ChurchMatchState {
  const result = startChurchMatch(players, [question, secondQuestion], 20);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}

describe("Church Mode engine", () => {
  it("reuses the production correct-answer score without awarding points for a miss", () => {
    const correct = applyChurchAnswer(players, "a", question, 1);
    const incorrect = applyChurchAnswer(correct.players, "b", question, 0);

    expect(correct.result).toMatchObject({ isCorrect: true, pointsAwarded: 100 });
    expect(correct.players[0]).toMatchObject({ score: 100, correctCount: 1 });
    expect(incorrect.result).toMatchObject({ isCorrect: false, pointsAwarded: 0 });
    expect(incorrect.players[1]).toMatchObject({ score: 0, correctCount: 0 });
  });

  it("treats a timeout as an unanswered question", () => {
    const timeout = applyChurchAnswer(players, "a", question, null);
    expect(timeout.result).toMatchObject({ selectedIndex: null, isCorrect: false, pointsAwarded: 0 });
  });

  it("ranks by score and then correct answers without mutating the lobby order", () => {
    const ranked = rankChurchPlayers([
      { ...players[0], score: 100, correctCount: 1 },
      { ...players[1], score: 200, correctCount: 2 },
    ]);
    expect(ranked.map((player) => player.name)).toEqual(["Ben", "Ada"]);
    expect(players.map((player) => player.name)).toEqual(["Ada", "Ben"]);
  });

  it("calculates a whole-number accuracy safely", () => {
    expect(getChurchAccuracy(7, 10)).toBe(70);
    expect(getChurchAccuracy(0, 0)).toBe(0);
  });

  it("START_MATCH validates readiness and atomically initializes gameplay", () => {
    expect(startChurchMatch(players.map((player, index) => ({ ...player, ready: index === 0 })), [question], 20)).toEqual({ ok: false, reason: "PLAYERS_NOT_READY" });
    const result = startChurchMatch(players, [question], 30);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state).toMatchObject({ phase: "question", questionIndex: 0, currentPlayerIndex: 0, answers: {}, timeLeft: 30 });
  });

  it("records exactly one answer per participant and scores only once", () => {
    const once = recordChurchAnswer(startedState(), "a", 1);
    const duplicate = recordChurchAnswer(once, "a", 1);
    expect(once.players[0].score).toBe(100);
    expect(duplicate).toBe(once);
    const finished = recordChurchAnswer(duplicate, "b", 0);
    expect(finished.phase).toBe("reveal");
    expect(Object.keys(finished.answers)).toHaveLength(2);
  });

  it("timeout preserves submitted answers and resolves unanswered players once", () => {
    const partial = recordChurchAnswer(startedState(), "a", 1);
    const timedOut = resolveChurchTimeout(partial);
    expect(timedOut.phase).toBe("reveal");
    expect(timedOut.players[0].score).toBe(100);
    expect(timedOut.answers.b).toMatchObject({ selectedIndex: null, isCorrect: false });
    expect(resolveChurchTimeout(timedOut)).toBe(timedOut);
  });

  it("clears answers for the next question and reaches final results", () => {
    let state = recordChurchAnswer(startedState(), "a", 1);
    state = recordChurchAnswer(state, "b", 0);
    state = advanceChurchQuestion(state);
    expect(state).toMatchObject({ phase: "question", questionIndex: 1, answers: {}, timeLeft: 20 });
    state = recordChurchAnswer(state, "a", 0);
    state = recordChurchAnswer(state, "b", 0);
    expect(advanceChurchQuestion(state).phase).toBe("results");
  });

  it("play again preserves participants/readiness but resets match progress", () => {
    const replay = replayChurchMatch({ ...startedState(), phase: "results", questionIndex: 1, answers: { a: { playerId: "a", selectedIndex: 1, isCorrect: true, pointsAwarded: 100 } } });
    expect(replay).toMatchObject({ phase: "lobby", questionIndex: 0, answers: {}, timeLeft: 20 });
    expect(replay.players.every((player) => player.ready)).toBe(true);
    expect(replay.players.every((player) => player.score === 0)).toBe(true);
  });

  it("quit/reset clears every active match value", () => {
    expect(resetChurchMatch(15)).toEqual({ phase: "lobby", players: [], questions: [], questionIndex: 0, currentPlayerIndex: 0, answers: {}, timeLeft: 15, secondsPerQuestion: 15 });
  });
});
