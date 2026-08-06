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
  endBattle,
  endBattleIfHostDisconnected,
  fetchRoomByCode,
  leaveRoom,
  submitAnswer,
  type RoomState,
} from "@/lib/liveBattleRoom";

const room = {
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
  state.client = makeFakeLiveBattleClient({ authUserId: "host-1", rooms: [{ ...room }], roomPlayers: [] });
});

describe("Live Battle termination lifecycle", () => {
  it.each(["waiting", "question", "reveal", "leaderboard"])("host ends an active battle with a verified retained row from %s", async (status) => {
    state.client = makeFakeLiveBattleClient({ authUserId: "host-1", rooms: [{ ...room, status }], roomPlayers: [] });
    const ended = await endBattle("room-1");
    expect(ended.status).toBe("ended");
    expect(ended.endedReason).toBe("host_ended");
    expect(state.client.tables.rooms[0]).toMatchObject({
      status: "ended",
      ended_reason: "host_ended",
      phase_ends_at: null,
      question_started_at: null,
      question_ends_at: null,
    });
    expect(state.client.rpcCalls).toEqual([]);
    expect(state.client.deletes).toEqual([]);
  });

  it("a non-host cannot end the room", async () => {
    state.client = makeFakeLiveBattleClient({ authUserId: "player-2", rooms: [{ ...room }], roomPlayers: [] });
    await expect(endBattle("room-1")).rejects.toThrow("Only the host");
    expect(state.client.tables.rooms[0].status).toBe("question");
    expect(state.client.deletes).toEqual([]);
  });

  it("uses the selected 30-second reconnect grace period", async () => {
    state.client = makeFakeLiveBattleClient({
      authUserId: "player-2",
      rooms: [{ ...room }],
      roomPlayers: [],
      rpcHandlers: { end_battle_if_host_disconnected: () => ({ data: true, error: null }) },
    });
    await expect(endBattleIfHostDisconnected("room-1")).resolves.toBe(true);
    expect(state.client.rpcCalls[0]).toEqual({
      name: "end_battle_if_host_disconnected",
      args: { p_room_id: "room-1", p_grace_seconds: 30 },
    });
  });

  it("normal player leave removes only that player and never ends the room", async () => {
    await leaveRoom("room-1", "player-2", false);
    expect(state.client.deletes).toEqual([{ table: "room_players", filters: { room_id: "room-1", player_id: "player-2" } }]);
    expect(state.client.rpcCalls).toEqual([]);
  });

  it("blocks client answer controls and advancement once ended", () => {
    expect(canSubmitLiveBattleAnswer("question")).toBe(true);
    expect(canSubmitLiveBattleAnswer("ended")).toBe(false);
    expect(canSubmitLiveBattleAnswer("finished")).toBe(false);
  });

  it("a player receives the ended state through the shared realtime mapper", () => {
    const active = {
      id: "room-1", code: "ABC123", hostId: "host-1", status: "question", currentQuestion: 2,
      questionCount: 10, language: "en", categoryId: "all", gameLevel: 1, maxPlayers: 12,
      questionStartedAt: room.question_started_at, questionEndsAt: room.question_ends_at,
      phaseEndsAt: room.phase_ends_at, endedReason: null, endedAt: null,
    } as RoomState;
    const ended = applyRoomRealtimeUpdate(active, {
      status: "ended", current_question: 2, question_started_at: null, question_ends_at: null,
      phase_ends_at: null, ended_reason: "host_ended", ended_at: "2026-08-06T10:00:05.000Z",
    });
    expect(ended).toMatchObject({ status: "ended", endedReason: "host_ended", questionEndsAt: null, phaseEndsAt: null });
  });

  it("refreshing an already-ended room returns the ended state", async () => {
    state.client = makeFakeLiveBattleClient({
      authUserId: "player-2",
      rooms: [{ ...room, status: "ended", ended_reason: "host_ended", ended_at: "2026-08-06T10:00:05.000Z" }],
      roomPlayers: [],
    });
    await expect(fetchRoomByCode("abc123")).resolves.toMatchObject({ status: "ended", endedReason: "host_ended" });
  });

  it("a stale player tab cannot submit or advance after the room ends", async () => {
    state.client = makeFakeLiveBattleClient({
      authUserId: "player-2",
      rooms: [{ ...room, status: "ended", ended_reason: "host_ended" }],
      roomPlayers: [],
    });
    await expect(submitAnswer("room-1", "room-question-2", 1)).rejects.toThrow("battle has ended");
    await expect(advancePhase("room-1", "reveal")).rejects.toThrow("battle has ended");
    expect(state.client.rpcCalls).toEqual([]);
  });

  it("migration atomically stops timers, records the reason, protects answers, and cleans ended rooms", () => {
    const migration = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/20260806_mission35_1_live_battle_termination.sql"), "utf8");
    const liveBattleRoom = fs.readFileSync(path.join(process.cwd(), "lib/liveBattleRoom.ts"), "utf8");
    const answerProtection = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/20260722_mission4_fixes.sql"), "utf8");
    expect(migration).toContain("status = 'ended'");
    expect(liveBattleRoom).toContain('ended_reason: "host_ended"');
    expect(migration).toContain("ended_reason = 'host_disconnected'");
    expect(migration).toContain("question_ends_at = null");
    expect(migration).toContain('create policy "Hosts can update rooms"');
    expect(migration).toContain("using (host_id = auth.uid())");
    expect(migration).toContain("with check (host_id = auth.uid())");
    expect(migration).toContain("revoke update on table public.rooms from anon");
    expect(migration).toContain("status = 'ended' and ended_at < now() - interval '2 hours'");
    expect(answerProtection).toContain("if v_room.status <> 'question' then");
    expect(answerProtection).toContain("This room is not accepting answers right now");
  });
});
