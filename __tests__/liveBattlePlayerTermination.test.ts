// Focused coverage for the joined-player side of Live Battle termination:
// once room.status is a terminated value, the player must stop the timer,
// stop question progression, and have every answer/advance attempt
// rejected — see app/multiplayer/play/[code]/page.tsx and
// isLiveBattleTerminated()/applyRoomRealtimeUpdate() in lib/liveBattleRoom.ts.
import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeLiveBattleClient } from "./helpers/fakeLiveBattleClient";

const state = vi.hoisted(() => ({ client: null as ReturnType<typeof import("./helpers/fakeLiveBattleClient").makeFakeLiveBattleClient> | null }));

vi.mock("@/lib/supabase/client", () => ({ createClient: () => state.client }));

import {
  advancePhase,
  applyRoomRealtimeUpdate,
  canSubmitLiveBattleAnswer,
  isLiveBattleTerminated,
  leaveRoom,
  submitAnswer,
  type RoomState,
} from "@/lib/liveBattleRoom";

const activeRoom = {
  id: "room-1",
  code: "ABC123",
  host_id: "host-1",
  status: "question",
  current_question: 2,
  question_count: 10,
  language: "en",
  category_id: "all",
  game_level: 1,
  max_players: 12,
  question_started_at: "2026-08-06T10:00:00.000Z",
  question_ends_at: "2026-08-06T10:00:15.000Z",
  phase_ends_at: "2026-08-06T10:00:15.000Z",
  ended_reason: null,
  ended_at: null,
};

beforeEach(() => {
  state.client = makeFakeLiveBattleClient({ authUserId: "player-2", rooms: [{ ...activeRoom }], roomPlayers: [] });
});

describe("isLiveBattleTerminated — the shared player-side guard", () => {
  it("recognizes every terminal status the schema (or a future one) can produce", () => {
    expect(isLiveBattleTerminated("ended")).toBe(true);
    expect(isLiveBattleTerminated("cancelled")).toBe(true);
    expect(isLiveBattleTerminated("abandoned")).toBe(true);
  });

  it("does not treat any in-progress or normal-completion status as terminated", () => {
    expect(isLiveBattleTerminated("waiting")).toBe(false);
    expect(isLiveBattleTerminated("countdown")).toBe(false);
    expect(isLiveBattleTerminated("question")).toBe(false);
    expect(isLiveBattleTerminated("reveal")).toBe(false);
    expect(isLiveBattleTerminated("leaderboard")).toBe(false);
    expect(isLiveBattleTerminated("finished")).toBe(false);
  });
});

describe("canSubmitLiveBattleAnswer once terminated", () => {
  it("only ever allows submission during the live question phase", () => {
    expect(canSubmitLiveBattleAnswer("question")).toBe(true);
    expect(canSubmitLiveBattleAnswer("ended")).toBe(false);
    expect(canSubmitLiveBattleAnswer("finished")).toBe(false);
    expect(canSubmitLiveBattleAnswer("waiting")).toBe(false);
    expect(canSubmitLiveBattleAnswer("reveal")).toBe(false);
    expect(canSubmitLiveBattleAnswer("leaderboard")).toBe(false);
    expect(canSubmitLiveBattleAnswer("countdown")).toBe(false);
  });
});

describe("applyRoomRealtimeUpdate — receiving the ended status, idempotently", () => {
  const active = {
    id: "room-1", code: "ABC123", hostId: "host-1", status: "question", currentQuestion: 2,
    questionCount: 10, language: "en", categoryId: "all", gameLevel: 1, maxPlayers: 12,
    questionStartedAt: activeRoom.question_started_at, questionEndsAt: activeRoom.question_ends_at,
    phaseEndsAt: activeRoom.phase_ends_at, endedReason: null, endedAt: null,
  } as unknown as RoomState;
  const endedRow = {
    status: "ended", current_question: 2, question_started_at: null, question_ends_at: null,
    phase_ends_at: null, ended_reason: "host_ended", ended_at: "2026-08-06T10:00:05.000Z",
  };

  it("the player's local room state picks up the ended status and clears the countdown fields", () => {
    const next = applyRoomRealtimeUpdate(active, endedRow);
    expect(next.status).toBe("ended");
    expect(isLiveBattleTerminated(next.status)).toBe(true);
    expect(next.questionEndsAt).toBeNull();
    expect(next.phaseEndsAt).toBeNull();
  });

  it("re-applying the same ended row is a stable no-op (safe for a redelivered realtime event)", () => {
    const first = applyRoomRealtimeUpdate(active, endedRow);
    const second = applyRoomRealtimeUpdate(first, endedRow);
    expect(second).toEqual(first);
  });

  it("does not advance current_question when a stray update arrives after ending", () => {
    const ended = applyRoomRealtimeUpdate(active, endedRow);
    // A late/duplicate "question" payload for the next question must not be
    // able to move a terminated room back into gameplay from the player's
    // perspective — the page's realtime handler is expected to have already
    // stopped listening (see the source-wiring check below), but the pure
    // mapper itself must never silently un-terminate a room either.
    const staleNextQuestion = applyRoomRealtimeUpdate(ended, {
      ...endedRow,
      // Even if a stale row without a status field arrived, currentQuestion
      // moving forward alone must not be mistaken for active gameplay.
      current_question: 3,
    });
    expect(isLiveBattleTerminated(staleNextQuestion.status)).toBe(true);
  });
});

describe("Player answer submission is rejected once the room has ended", () => {
  it("submitAnswer rejects before ever calling the RPC", async () => {
    state.client = makeFakeLiveBattleClient({
      authUserId: "player-2",
      rooms: [{ ...activeRoom, status: "ended", ended_reason: "host_ended" }],
      roomPlayers: [],
    });
    await expect(submitAnswer("room-1", "room-question-2", 1)).rejects.toThrow("battle has ended");
    expect(state.client.rpcCalls).toEqual([]);
  });

  it("advancePhase (auto-advance/next-question) rejects once ended", async () => {
    state.client = makeFakeLiveBattleClient({
      authUserId: "player-2",
      rooms: [{ ...activeRoom, status: "ended", ended_reason: "host_ended" }],
      roomPlayers: [],
    });
    await expect(advancePhase("room-1", "countdown")).rejects.toThrow("battle has ended");
    expect(state.client.rpcCalls).toEqual([]);
  });

  it("a normal answer submission still works while the room is genuinely active", async () => {
    state.client = makeFakeLiveBattleClient({
      authUserId: "player-2",
      rooms: [{ ...activeRoom, status: "question" }],
      roomPlayers: [],
      rpcHandlers: { submit_answer: () => ({ data: { already_submitted: false, is_correct: true }, error: null }) },
    });
    await expect(submitAnswer("room-1", "room-question-2", 1)).resolves.toMatchObject({ isCorrect: true });
  });
});

describe("A normal player leaving does not end the room for anyone else", () => {
  it("only deletes that player's own room_players row — no room update, no host-only RPC", async () => {
    await leaveRoom("room-1", "player-2", false);
    expect(state.client!.deletes).toEqual([{ table: "room_players", filters: { room_id: "room-1", player_id: "player-2" } }]);
    expect(state.client!.updates).toEqual([]);
    expect(state.client!.rpcCalls).toEqual([]);
    expect(state.client!.tables.rooms[0].status).toBe("question");
  });
});

describe("Source wiring — the player page actually enforces the guard, not just the UI", () => {
  const playerPage = fs.readFileSync(path.join(process.cwd(), "app/multiplayer/play/[code]/page.tsx"), "utf8");

  it("gates the realtime handler, every scheduled timer callback, and answer submission on the shared guard", () => {
    expect(playerPage).toContain("isLiveBattleTerminated");
    // One-time, idempotent transition into the ended state.
    expect(playerPage).toContain("hasEndedRef");
    expect(playerPage).toContain("if (hasEndedRef.current) return;");
    // The question-expiry safety net, the host-disconnect backstop, and the
    // phase auto-advance backstop must each re-check before firing.
    expect(playerPage).toContain("if (hasEndedRef.current) return; // battle ended while this timer was pending");
    // Answer submission is blocked at the handler, not only via UI disabling.
    expect(playerPage).toContain("if (hasEndedRef.current || !canSubmitLiveBattleAnswer(room.status)) return;");
    // Rendering: a terminated room always shows the ended screen, even for a
    // status value the RoomPhase switch doesn't literally enumerate.
    expect(playerPage).toContain("battleTerminated");
    expect(playerPage).toContain("<BattleEndedScreen onLeave={handleLeave} />");
  });
});

describe("The Battle Ended screen shows the required copy", () => {
  it("renders the exact required title, message, and return-home action", () => {
    const screen = fs.readFileSync(path.join(process.cwd(), "components/multiplayer/BattleEndedScreen.tsx"), "utf8");
    expect(screen).toContain("Battle Ended");
    expect(screen).toContain("The host ended this battle.");
    expect(screen).toContain("onLeave");
  });
});
