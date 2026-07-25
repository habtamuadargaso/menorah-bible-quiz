import { describe, it, expect, vi } from "vitest";
import { makeFakeLiveBattleClient, type FakeLiveBattleFixture } from "./helpers/fakeLiveBattleClient";

// vi.mock factories are hoisted above imports, so the fixture the mock reads
// from must be created via vi.hoisted rather than a plain module variable
// (same pattern as translationGating.test.ts).
const state = vi.hoisted(() => ({ client: null as ReturnType<typeof import("./helpers/fakeLiveBattleClient").makeFakeLiveBattleClient> | null }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => state.client,
}));

import {
  fetchRoomPlayers,
  fetchRoomQuestion,
  joinBattleRoom,
  setPlayerLanguage,
} from "@/lib/liveBattleRoom";

function setFixture(fixture: FakeLiveBattleFixture) {
  state.client = makeFakeLiveBattleClient(fixture);
}

const baseRoom = {
  id: "room-1",
  code: "ABCD12",
  host_id: "host-1",
  status: "waiting",
  max_players: 12,
  // The host's own chosen language — Mission 13's whole point is that this
  // must NOT be what a joining player's question fetch uses.
  language: "am",
};

describe("Mission 13 — joinBattleRoom stores the player's OWN language, not the host's", () => {
  it("inserts room_players.language_code as the language the player picked on the join screen", async () => {
    setFixture({ authUserId: "player-2", rooms: [baseRoom], roomPlayers: [] });

    await joinBattleRoom({ code: "ABCD12", playerName: "John", language: "en" });

    const inserted = state.client!.inserts.room_players;
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({
      player_id: "player-2",
      display_name: "John",
      language_code: "en",
    });
    // The room itself is in Amharic — proves the player's row never just
    // copies the host's room.language.
    expect(inserted[0].language_code).not.toBe(baseRoom.language);
  });

  it("lets two different players join the same (Amharic) room in English and Spanish respectively", async () => {
    setFixture({ authUserId: "player-2", rooms: [baseRoom], roomPlayers: [] });
    await joinBattleRoom({ code: "ABCD12", playerName: "John", language: "en" });

    setFixture({ authUserId: "player-3", rooms: [baseRoom], roomPlayers: [] });
    await joinBattleRoom({ code: "ABCD12", playerName: "Maria", language: "es" });

    expect(state.client!.inserts.room_players[0].language_code).toBe("es");
  });
});

describe("Mission 13 — fetchRoomPlayers surfaces each player's own language_code", () => {
  it("returns the host (Amharic), one English player, and one Spanish player as distinct languageCode values", async () => {
    setFixture({
      authUserId: "host-1",
      rooms: [baseRoom],
      roomPlayers: [
        {
          id: "rp-host",
          room_id: "room-1",
          player_id: "host-1",
          display_name: "Habtamu",
          score: 0,
          is_ready: true,
          current_streak: 0,
          last_seen_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
          language_code: "am",
        },
        {
          id: "rp-john",
          room_id: "room-1",
          player_id: "player-2",
          display_name: "John",
          score: 0,
          is_ready: true,
          current_streak: 0,
          last_seen_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
          language_code: "en",
        },
        {
          id: "rp-maria",
          room_id: "room-1",
          player_id: "player-3",
          display_name: "Maria",
          score: 0,
          is_ready: true,
          current_streak: 0,
          last_seen_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
          language_code: "es",
        },
      ],
    });

    const players = await fetchRoomPlayers("room-1");
    const byName = Object.fromEntries(players.map((p) => [p.displayName, p.languageCode]));
    expect(byName).toEqual({ Habtamu: "am", John: "en", Maria: "es" });
  });

  it("reconnect: re-fetching players still returns the same persisted language_code for an existing player", async () => {
    const roomPlayers = [
      {
        id: "rp-john",
        room_id: "room-1",
        player_id: "player-2",
        display_name: "John",
        score: 40,
        is_ready: true,
        current_streak: 1,
        last_seen_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
        language_code: "en",
      },
    ];
    setFixture({ authUserId: "player-2", rooms: [{ ...baseRoom, status: "question" }], roomPlayers });

    const firstFetch = await fetchRoomPlayers("room-1");
    const secondFetch = await fetchRoomPlayers("room-1"); // simulates the page remounting on reconnect

    expect(firstFetch[0].languageCode).toBe("en");
    expect(secondFetch[0].languageCode).toBe("en");
  });
});

describe("Mission 13 — setPlayerLanguage goes through the guarded RPC, never a raw column update", () => {
  it("calls set_room_player_language with the room id and the new language code", async () => {
    setFixture({
      authUserId: "player-2",
      rooms: [baseRoom],
      roomPlayers: [],
      rpcHandlers: {
        set_room_player_language: () => ({ data: null, error: null }),
      },
    });

    await setPlayerLanguage("room-1", "sw");

    expect(state.client!.rpcCalls).toEqual([{ name: "set_room_player_language", args: { p_room_id: "room-1", p_language_code: "sw" } }]);
  });

  it("propagates a server-side rejection (e.g. the battle already started) instead of swallowing it", async () => {
    setFixture({
      authUserId: "player-2",
      rooms: [baseRoom],
      roomPlayers: [],
      rpcHandlers: {
        set_room_player_language: () => ({ data: null, error: { message: "Language is locked once the battle has started" } }),
      },
    });

    await expect(setPlayerLanguage("room-1", "fr")).rejects.toMatchObject({
      message: "Language is locked once the battle has started",
    });
  });
});

describe("Mission 13 — fetchRoomQuestion: explicit (never silent) English fallback per player", () => {
  it("passes through translationAvailable:false with English fallback text — the caller can show the explicit fallback message", async () => {
    setFixture({
      authUserId: "player-2",
      rooms: [baseRoom],
      roomPlayers: [],
      rpcHandlers: {
        get_room_question: () => ({
          data: [
            {
              room_question_id: "rq-1",
              question_number: 1,
              reference: "John 3:16",
              question_text: "For God so loved the world...",
              choice_1: "A",
              choice_2: "B",
              choice_3: "C",
              choice_4: "D",
              correct_index: null,
              explanation: null,
              translation_available: false,
            },
          ],
          error: null,
        }),
      },
    });

    const question = await fetchRoomQuestion("room-1", "sw");
    expect(question).not.toBeNull();
    expect(question!.translationAvailable).toBe(false);
    expect(question!.questionText).toBe("For God so loved the world...");
  });

  it("passes through translationAvailable:true when the player's own language has a published translation", async () => {
    setFixture({
      authUserId: "player-3",
      rooms: [baseRoom],
      roomPlayers: [],
      rpcHandlers: {
        get_room_question: () => ({
          data: [
            {
              room_question_id: "rq-1",
              question_number: 1,
              reference: "Juan 3:16",
              question_text: "Porque de tal manera amó Dios al mundo...",
              choice_1: "A",
              choice_2: "B",
              choice_3: "C",
              choice_4: "D",
              correct_index: null,
              explanation: null,
              translation_available: true,
            },
          ],
          error: null,
        }),
      },
    });

    const question = await fetchRoomQuestion("room-1", "es");
    expect(question!.translationAvailable).toBe(true);
    expect(question!.questionText).toBe("Porque de tal manera amó Dios al mundo...");
  });

  it("the exact same room_question_id (canonical question) is returned regardless of which language was requested", async () => {
    setFixture({
      authUserId: "player-2",
      rooms: [baseRoom],
      roomPlayers: [],
      rpcHandlers: {
        get_room_question: (args) => ({
          data: [
            {
              room_question_id: "rq-shared",
              question_number: 3,
              reference: "Genesis 1:1",
              question_text: args.p_lang === "am" ? "Amharic text" : "English text",
              choice_1: "A",
              choice_2: "B",
              choice_3: "C",
              choice_4: "D",
              correct_index: null,
              explanation: null,
              translation_available: true,
            },
          ],
          error: null,
        }),
      },
    });

    const hostView = await fetchRoomQuestion("room-1", "am");
    const playerView = await fetchRoomQuestion("room-1", "en");

    expect(hostView!.roomQuestionId).toBe(playerView!.roomQuestionId);
    expect(hostView!.questionNumber).toBe(playerView!.questionNumber);
    expect(hostView!.questionText).not.toBe(playerView!.questionText);
  });
});
