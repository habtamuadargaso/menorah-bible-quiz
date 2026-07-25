import { describe, it, expect, vi } from "vitest";
import { makeFakeLiveBattleClient, type FakeLiveBattleFixture } from "./helpers/fakeLiveBattleClient";
import type { LoadedQuestion } from "@/lib/questions/loadQuestions";

const state = vi.hoisted(() => ({
  client: null as ReturnType<typeof import("./helpers/fakeLiveBattleClient").makeFakeLiveBattleClient> | null,
  pool: [] as LoadedQuestion[],
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => state.client,
}));

// seedRoomQuestions' OWN level/language filtering is loadQuestionsForLevel's
// job (already covered by __tests__/translationGating.test.ts's "published
// question + published translation, exact language, no English fallback"
// suite) — mocked here so these tests can focus purely on what
// seedRoomQuestions/selectRoomQuestionIds do with the pool it returns:
// category, randomization, recent-room exclusion, and never touching
// another room's rows.
vi.mock("@/lib/questions/loadQuestions", () => ({
  loadQuestionsForLevel: () => Promise.resolve(state.pool),
}));

import { seedRoomQuestions, type RoomState } from "@/lib/liveBattleRoom";

function setFixture(fixture: FakeLiveBattleFixture, pool: LoadedQuestion[]) {
  state.client = makeFakeLiveBattleClient(fixture);
  state.pool = pool;
}

function makeQuestion(id: string, overrides: Partial<LoadedQuestion> = {}): LoadedQuestion {
  return {
    id,
    level: 3,
    category: "Old Testament",
    book: "Genesis",
    chapter: 1,
    difficulty: "easy",
    correctIndex: 0,
    reference: `Genesis 1:${id}`,
    question: `Question ${id}`,
    choices: ["A", "B", "C", "D"],
    explanation: "Because.",
    reflection: null,
    ...overrides,
  };
}

function pool(count: number, overrides: Partial<LoadedQuestion> = {}): LoadedQuestion[] {
  return Array.from({ length: count }, (_, i) => makeQuestion(`Q${i + 1}`, overrides));
}

const baseRoom: RoomState = {
  id: "room-new",
  code: "ABCD12",
  hostId: "host-1",
  status: "waiting",
  currentQuestion: 0,
  questionCount: 10,
  language: "en",
  categoryId: "old-testament",
  gameLevel: 3,
  maxPlayers: 12,
  questionStartedAt: null,
  questionEndsAt: null,
  phaseEndsAt: null,
};

describe("Mission 14 — seedRoomQuestions", () => {
  it("inserts exactly questionCount rows for the new room, numbered 1..N", async () => {
    setFixture({ authUserId: "host-1", rooms: [], roomPlayers: [] }, pool(20));

    await seedRoomQuestions(baseRoom);

    const inserted = state.client!.inserts.room_questions;
    expect(inserted).toHaveLength(10);
    expect(inserted.map((r) => r.question_number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(inserted.every((r) => r.room_id === "room-new")).toBe(true);
  });

  it("never touches another room's room_questions rows", async () => {
    const otherRoomsQuestions = [
      { id: "rq-old-1", room_id: "room-old", question_number: 1, question_id: "OLD1" },
      { id: "rq-old-2", room_id: "room-old", question_number: 2, question_id: "OLD2" },
    ];
    setFixture({ authUserId: "host-1", rooms: [], roomPlayers: [], roomQuestions: otherRoomsQuestions }, pool(20));

    await seedRoomQuestions(baseRoom);

    // The delete seedRoomQuestions issues is scoped to eq("room_id", room.id)
    // — assert it was never called against the old room, and the old room's
    // rows are still present after seeding the new one.
    expect(state.client!.deletes.some((d) => d.filters.room_id === "room-old")).toBe(false);
    const remaining = state.client!.tables.room_questions.filter((r) => r.room_id === "room-old");
    expect(remaining).toHaveLength(2);
  });

  it("excludes question ids from the host's most recently finished room when enough alternatives exist", async () => {
    const bigPool = pool(20);
    const recentRoomId = "room-recent-finished";
    const recentIds = bigPool.slice(0, 10).map((q) => q.id);
    setFixture(
      {
        authUserId: "host-1",
        rooms: [
          { id: recentRoomId, code: "OLD001", host_id: "host-1", status: "finished", max_players: 12, language: "en", created_at: "2026-01-01T00:00:00Z" },
        ],
        roomPlayers: [],
        roomQuestions: recentIds.map((qid, i) => ({ id: `rq-${i}`, room_id: recentRoomId, question_number: i + 1, question_id: qid })),
      },
      bigPool
    );

    await seedRoomQuestions(baseRoom);

    const insertedIds = state.client!.inserts.room_questions.map((r) => r.question_id);
    expect(insertedIds.some((id) => recentIds.includes(id as string))).toBe(false);
  });

  it("allows reuse of the recent room's questions instead of failing when the pool is too small to exclude them", async () => {
    const smallPool = pool(10);
    const recentRoomId = "room-recent-finished";
    const recentIds = smallPool.slice(0, 6).map((q) => q.id);
    setFixture(
      {
        authUserId: "host-1",
        rooms: [
          { id: recentRoomId, code: "OLD001", host_id: "host-1", status: "finished", max_players: 12, language: "en", created_at: "2026-01-01T00:00:00Z" },
        ],
        roomPlayers: [],
        roomQuestions: recentIds.map((qid, i) => ({ id: `rq-${i}`, room_id: recentRoomId, question_number: i + 1, question_id: qid })),
      },
      smallPool
    );

    await expect(seedRoomQuestions(baseRoom)).resolves.toBeUndefined();
    expect(state.client!.inserts.room_questions).toHaveLength(10);
  });

  it("throws a clear message instead of creating a partial room when the pool is too small", async () => {
    setFixture({ authUserId: "host-1", rooms: [], roomPlayers: [] }, pool(3));

    await expect(seedRoomQuestions(baseRoom)).rejects.toThrow(/only has 3 eligible question\(s\)/);
    expect(state.client!.inserts.room_questions ?? []).toHaveLength(0);
  });
});
