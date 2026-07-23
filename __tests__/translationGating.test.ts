import { describe, it, expect, vi } from "vitest";
import { makeFakeSupabaseClient, type FakeSupabaseFixture } from "./helpers/fakeSupabase";

// vi.mock factories are hoisted above imports, so the fixture the mock
// reads from must be created via vi.hoisted rather than a plain module
// variable.
const state = vi.hoisted(() => ({ client: null as ReturnType<typeof import("./helpers/fakeSupabase").makeFakeSupabaseClient> | null }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => state.client,
}));

import { loadQuestionsForLevel, loadQuestionsForLanguage } from "@/lib/questions/loadQuestions";
import { loadQuestionById } from "@/lib/questions/loadQuestionById";

function setFixture(fixture: FakeSupabaseFixture) {
  state.client = makeFakeSupabaseClient(fixture);
}

const baseQuestion = {
  id: "Q1",
  level: 1,
  category: "Old Testament",
  book: "Genesis",
  chapter: 1,
  difficulty: "easy",
  reference: "Genesis 1:1",
  status: "published",
};

function translation(overrides: Partial<FakeSupabaseFixture["translations"][number]>) {
  return {
    question_id: "Q1",
    language_code: "am",
    question_text: "Amharic text",
    choice_1: "A",
    choice_2: "B",
    choice_3: "C",
    choice_4: "D",
    reflection: null,
    status: "published",
    ...overrides,
  };
}

const answerKey = { question_id: "Q1", correct_index: 0, explanation: "Because." };

describe("loadQuestionsForLevel — translation publish gating", () => {
  it("does not return a question whose translation is still an ai_draft", async () => {
    setFixture({
      questions: [baseQuestion],
      translations: [translation({ status: "ai_draft" })],
      answerKeys: [answerKey],
    });

    const result = await loadQuestionsForLevel(1, "am");
    expect(result).toEqual([]);
  });

  it("does not return a question whose translation is approved but not yet published", async () => {
    setFixture({
      questions: [baseQuestion],
      translations: [translation({ status: "approved" })],
      answerKeys: [answerKey],
    });

    const result = await loadQuestionsForLevel(1, "am");
    expect(result).toEqual([]);
  });

  it("returns the question once its translation is published, in the selected language", async () => {
    setFixture({
      questions: [baseQuestion],
      translations: [translation({ status: "published" })],
      answerKeys: [answerKey],
    });

    const result = await loadQuestionsForLevel(1, "am");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "Q1",
      question: "Amharic text",
      choices: ["A", "B", "C", "D"],
      correctIndex: 0,
    });
  });

  it("does not return a translation for the wrong language code even when published", async () => {
    setFixture({
      questions: [baseQuestion],
      translations: [translation({ language_code: "en", status: "published", question_text: "English text" })],
      answerKeys: [answerKey],
    });

    const result = await loadQuestionsForLevel(1, "am");
    expect(result).toEqual([]);
  });

  it("never substitutes English when the requested language has its own published translation", async () => {
    setFixture({
      questions: [baseQuestion],
      translations: [
        translation({ language_code: "en", status: "published", question_text: "English text" }),
        translation({ language_code: "am", status: "published", question_text: "Amharic text" }),
      ],
      answerKeys: [answerKey],
    });

    const result = await loadQuestionsForLevel(1, "am");
    expect(result).toHaveLength(1);
    expect(result[0].question).toBe("Amharic text");
  });

  it("does not return a question whose parent is not published, even with a published translation", async () => {
    setFixture({
      questions: [{ ...baseQuestion, status: "draft" }],
      translations: [translation({ status: "published" })],
      answerKeys: [answerKey],
    });

    const result = await loadQuestionsForLevel(1, "am");
    expect(result).toEqual([]);
  });
});

describe("loadQuestionsForLanguage — Friends Battle's all-levels DB loader", () => {
  it("returns published, exact-language questions across every level (no level filter applied)", async () => {
    setFixture({
      questions: [
        { ...baseQuestion, id: "Q1", level: 1 },
        { ...baseQuestion, id: "Q2", level: 7 },
      ],
      translations: [
        translation({ question_id: "Q1", status: "published", question_text: "Level 1 Amharic" }),
        { ...translation({ status: "published", question_text: "Level 7 Amharic" }), question_id: "Q2" },
      ],
      answerKeys: [answerKey, { ...answerKey, question_id: "Q2" }],
    });

    const result = await loadQuestionsForLanguage("am");
    expect(result.map((q) => q.id).sort()).toEqual(["Q1", "Q2"]);
  });

  it("still excludes ai_draft translations regardless of level", async () => {
    setFixture({
      questions: [baseQuestion],
      translations: [translation({ status: "ai_draft" })],
      answerKeys: [answerKey],
    });

    const result = await loadQuestionsForLanguage("am");
    expect(result).toEqual([]);
  });
});

describe("loadQuestionById — translation publish gating", () => {
  it("returns null for a draft translation of an id that doesn't exist in the local bank", async () => {
    setFixture({
      questions: [baseQuestion],
      translations: [translation({ status: "ai_draft" })],
      answerKeys: [answerKey],
    });

    const result = await loadQuestionById("Q1", "am");
    expect(result).toBeNull();
  });

  it("returns null for an approved-but-unpublished translation", async () => {
    setFixture({
      questions: [baseQuestion],
      translations: [translation({ status: "approved" })],
      answerKeys: [answerKey],
    });

    const result = await loadQuestionById("Q1", "am");
    expect(result).toBeNull();
  });

  it("returns the published translation in the exact requested language", async () => {
    setFixture({
      questions: [baseQuestion],
      translations: [translation({ status: "published" })],
      answerKeys: [answerKey],
    });

    const result = await loadQuestionById("Q1", "am");
    expect(result).not.toBeNull();
    expect(result?.question).toBe("Amharic text");
  });

  it("never falls back to English when the exact language has no published row", async () => {
    setFixture({
      questions: [baseQuestion],
      translations: [translation({ language_code: "en", status: "published", question_text: "English text" })],
      answerKeys: [answerKey],
    });

    const result = await loadQuestionById("Q1", "am");
    expect(result).toBeNull();
  });
});
