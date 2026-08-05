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
  startChurchTurn,
  tickChurchTimer,
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
  return startChurchTurn(result.state);
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
    if (result.ok) expect(result.state).toMatchObject({ phase: "handoff", questionIndex: 0, currentPlayerIndex: 0, answers: {}, timeLeft: 30 });
  });

  it("keeps the timer paused in handoff and starts one full turn atomically", () => {
    const result = startChurchMatch(players, [question], 15);
    if (!result.ok) throw new Error(result.reason);
    expect(tickChurchTimer(result.state)).toBe(result.state);
    const answering = startChurchTurn(result.state);
    expect(answering).toMatchObject({ phase: "answering", currentPlayerIndex: 0, timeLeft: 15 });
    expect(startChurchTurn(answering)).toBe(answering);
  });

  it("records exactly one answer per participant and scores only once", () => {
    const once = recordChurchAnswer(startedState(), "a", 1);
    expect(once).toMatchObject({ phase: "handoff", currentPlayerIndex: 1, timeLeft: 20 });
    const duplicate = recordChurchAnswer(once, "a", 1);
    expect(once.players[0].score).toBe(100);
    expect(duplicate).toBe(once);
    const finished = recordChurchAnswer(startChurchTurn(duplicate), "b", 0);
    expect(finished.phase).toBe("reveal");
    expect(Object.keys(finished.answers)).toHaveLength(2);
  });

  it("timeout preserves submitted answers and resolves unanswered players once", () => {
    const partial = recordChurchAnswer(startedState(), "a", 1);
    const timedOut = resolveChurchTimeout(startChurchTurn(partial));
    expect(timedOut.phase).toBe("reveal");
    expect(timedOut.players[0].score).toBe(100);
    expect(timedOut.answers.b).toMatchObject({ selectedIndex: null, isCorrect: false });
    expect(resolveChurchTimeout(timedOut)).toBe(timedOut);
  });

  it("resets the full timer for every participant after answers and timeouts", () => {
    const initial = { ...startedState(), timeLeft: 7 };
    const afterAnswer = recordChurchAnswer(initial, "a", 0);
    expect(afterAnswer).toMatchObject({ currentPlayerIndex: 1, timeLeft: 20, phase: "handoff" });

    const threePlayers = [...players, { id: "c", name: "Cam", ready: true, score: 0, correctCount: 0 }];
    const result = startChurchMatch(threePlayers, [question], 45);
    if (!result.ok) throw new Error(result.reason);
    const afterTimeout = resolveChurchTimeout({ ...startChurchTurn(result.state), timeLeft: 0 });
    expect(afterTimeout).toMatchObject({ currentPlayerIndex: 1, timeLeft: 45, phase: "handoff" });
    expect(afterTimeout.answers.a).toMatchObject({ selectedIndex: null, isCorrect: false });
    expect(afterTimeout.answers.b).toBeUndefined();
  });

  it("waits to reveal until every participant has answered or timed out", () => {
    const first = resolveChurchTimeout({ ...startedState(), timeLeft: 0 });
    expect(first.phase).toBe("handoff");
    expect(Object.keys(first.answers)).toEqual(["a"]);
    const final = recordChurchAnswer(startChurchTurn(first), "b", 1);
    expect(final.phase).toBe("reveal");
    expect(Object.keys(final.answers)).toHaveLength(2);
    expect(final.players[1].score).toBe(100);
  });

  it("pauses and resumes the current participant timer without resetting it", () => {
    const atTwelve = { ...startedState(), timeLeft: 12 };
    expect(tickChurchTimer(atTwelve, true)).toBe(atTwelve);
    expect(tickChurchTimer(atTwelve, false).timeLeft).toBe(11);
  });

  it("completes an eight-player question in order with mixed answers and timeouts", () => {
    const eightPlayers = Array.from({ length: 8 }, (_, index) => ({
      id: `p${index + 1}`,
      name: `Player ${index + 1}`,
      ready: true,
      score: 0,
      correctCount: 0,
    }));
    const result = startChurchMatch(eightPlayers, [question], 45);
    if (!result.ok) throw new Error(result.reason);
    let state = result.state;

    for (let index = 0; index < eightPlayers.length; index += 1) {
      expect(state.currentPlayerIndex).toBe(index);
      expect(state.timeLeft).toBe(45);
      expect(state.phase).toBe("handoff");
      state = startChurchTurn(state);
      state = index % 2 === 0
        ? recordChurchAnswer(state, eightPlayers[index].id, 1)
        : resolveChurchTimeout({ ...state, timeLeft: 0 });
    }

    expect(state.phase).toBe("reveal");
    expect(Object.keys(state.answers)).toHaveLength(8);
    expect(state.players.map((player) => player.score)).toEqual([100, 0, 100, 0, 100, 0, 100, 0]);
  });

  it("clears answers for the next question and reaches final results", () => {
    let state = recordChurchAnswer(startedState(), "a", 1);
    state = recordChurchAnswer(startChurchTurn(state), "b", 0);
    state = advanceChurchQuestion(state);
    expect(state).toMatchObject({ phase: "handoff", questionIndex: 1, currentPlayerIndex: 0, answers: {}, timeLeft: 20 });
    state = recordChurchAnswer(startChurchTurn(state), "a", 0);
    state = recordChurchAnswer(startChurchTurn(state), "b", 0);
    expect(advanceChurchQuestion(state).phase).toBe("results");
  });

  it("play again preserves participants/readiness but resets match progress", () => {
    const replay = replayChurchMatch({ ...startedState(), phase: "results", questionIndex: 1, answers: { a: { playerId: "a", selectedIndex: 1, isCorrect: true, pointsAwarded: 100 } } });
    expect(replay).toMatchObject({ phase: "handoff", questionIndex: 0, currentPlayerIndex: 0, answers: {}, timeLeft: 20 });
    expect(replay.players.every((player) => player.ready)).toBe(true);
    expect(replay.players.every((player) => player.score === 0)).toBe(true);
  });

  it("quit/reset clears every active match value", () => {
    expect(resetChurchMatch(15)).toEqual({ phase: "lobby", players: [], questions: [], questionIndex: 0, currentPlayerIndex: 0, answers: {}, timeLeft: 15, secondsPerQuestion: 15 });
  });
});
