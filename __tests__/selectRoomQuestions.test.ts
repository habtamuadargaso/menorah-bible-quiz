import { describe, it, expect } from "vitest";
import { selectRoomQuestionIds } from "@/lib/questions/selectRoomQuestions";
import type { LoadedQuestion } from "@/lib/questions/loadQuestions";

function makeQuestion(id: string, overrides: Partial<LoadedQuestion> = {}): LoadedQuestion {
  return {
    id,
    level: 1,
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

describe("Mission 14 — selectRoomQuestionIds", () => {
  it("a Level 1 room's pool only ever contains Level 1 questions, and every selected id comes from that pool", () => {
    const levelOnePool = pool(15, { level: 1 });
    const result = selectRoomQuestionIds({
      levelLanguagePool: levelOnePool,
      categoryId: "old-testament",
      questionCount: 10,
      recentlyUsedIds: new Set(),
    });
    expect(result.selectedQuestionIds).toHaveLength(10);
    const poolIds = new Set(levelOnePool.map((q) => q.id));
    expect(result.selectedQuestionIds.every((id) => poolIds.has(id))).toBe(true);
  });

  it("a Level 5 room's pool only ever contains Level 5 questions, and every selected id comes from that pool", () => {
    const levelFivePool = pool(15, { level: 5 });
    const result = selectRoomQuestionIds({
      levelLanguagePool: levelFivePool,
      categoryId: "old-testament",
      questionCount: 10,
      recentlyUsedIds: new Set(),
    });
    expect(result.selectedQuestionIds).toHaveLength(10);
    const poolIds = new Set(levelFivePool.map((q) => q.id));
    expect(result.selectedQuestionIds.every((id) => poolIds.has(id))).toBe(true);
  });

  it("never returns duplicate question ids within one selection", () => {
    const bigPool = pool(50);
    const result = selectRoomQuestionIds({
      levelLanguagePool: bigPool,
      categoryId: "old-testament",
      questionCount: 10,
      recentlyUsedIds: new Set(),
    });
    expect(new Set(result.selectedQuestionIds).size).toBe(10);
  });

  it("dedupes a pool containing the same question id twice before sampling (belt-and-suspenders)", () => {
    const dupedPool = [...pool(10), makeQuestion("Q1"), makeQuestion("Q2")];
    const result = selectRoomQuestionIds({
      levelLanguagePool: dupedPool,
      categoryId: "old-testament",
      questionCount: 10,
      recentlyUsedIds: new Set(),
    });
    expect(new Set(result.selectedQuestionIds).size).toBe(10);
    expect(result.eligibleCount).toBe(10); // the 2 dupes collapsed away
  });

  it("two rooms created from the same large pool do not always receive the identical set of question ids", () => {
    const bigPool = pool(40);
    const runs = Array.from({ length: 8 }, () =>
      selectRoomQuestionIds({
        levelLanguagePool: bigPool,
        categoryId: "old-testament",
        questionCount: 10,
        recentlyUsedIds: new Set(),
      }).selectedQuestionIds.join(",")
    );
    // Old behavior (dbQuestions.slice(0, 10), no shuffle) always produced
    // the exact same 10 ids from the exact same pool — this is the bug
    // this mission fixes. With real randomization over 8 runs against a
    // 40-question pool, seeing every run identical would be astronomically
    // unlikely (this is what would fail if the shuffle were removed again).
    expect(new Set(runs).size).toBeGreaterThan(1);
  });

  it("filters to the host's chosen category when enough category-matching questions exist", () => {
    const mixed = [
      ...pool(10, { category: "Old Testament" }),
      ...pool(10, { category: "Apostles" }).map((q, i) => ({ ...q, id: `A${i + 1}` })),
    ];
    const result = selectRoomQuestionIds({
      levelLanguagePool: mixed,
      categoryId: "apostles",
      questionCount: 10,
      recentlyUsedIds: new Set(),
    });
    expect(result.usedCategoryFallback).toBe(false);
    expect(result.selectedQuestionIds.every((id) => id.startsWith("A"))).toBe(true);
  });

  it("falls back to the full level+language pool (never fails outright) when the chosen category is too thin", () => {
    const mostlyOldTestament = [
      ...pool(9, { category: "Old Testament" }),
      ...pool(2, { category: "Apostles" }).map((q, i) => ({ ...q, id: `A${i + 1}` })),
    ];
    const result = selectRoomQuestionIds({
      levelLanguagePool: mostlyOldTestament,
      categoryId: "apostles",
      questionCount: 10,
      recentlyUsedIds: new Set(),
    });
    expect(result.categoryEligibleCount).toBe(2);
    expect(result.usedCategoryFallback).toBe(true);
    expect(result.selectedQuestionIds).toHaveLength(10);
  });

  it("excludes the host's most-recently-used question ids when enough alternatives remain", () => {
    const bigPool = pool(20);
    const recentlyUsedIds = new Set(bigPool.slice(0, 10).map((q) => q.id));
    const result = selectRoomQuestionIds({
      levelLanguagePool: bigPool,
      categoryId: "old-testament",
      questionCount: 10,
      recentlyUsedIds,
    });
    expect(result.usedRecentExclusion).toBe(true);
    expect(result.selectedQuestionIds.some((id) => recentlyUsedIds.has(id))).toBe(false);
  });

  it("allows reuse of recently-used ids instead of failing when the pool is too small to exclude them", () => {
    const smallPool = pool(10);
    const recentlyUsedIds = new Set(smallPool.slice(0, 5).map((q) => q.id));
    const result = selectRoomQuestionIds({
      levelLanguagePool: smallPool,
      categoryId: "old-testament",
      questionCount: 10,
      recentlyUsedIds,
    });
    expect(result.usedRecentExclusion).toBe(false);
    expect(result.selectedQuestionIds).toHaveLength(10);
  });

  it("throws a clear, actionable message when the eligible pool is smaller than the requested question count", () => {
    const tinyPool = pool(4);
    expect(() =>
      selectRoomQuestionIds({
        levelLanguagePool: tinyPool,
        categoryId: "old-testament",
        questionCount: 10,
        recentlyUsedIds: new Set(),
      })
    ).toThrowError(/only has 4 eligible question\(s\)/);
  });
});
