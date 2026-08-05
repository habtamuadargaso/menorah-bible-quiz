import { describe, expect, it } from "vitest";
import { ALL_LANGUAGES, enabledChurchModeLanguages, type LangCode, type LanguageInfo } from "@/lib/i18n/locales";
import { churchModeLanguages, selectChurchQuestions } from "@/lib/churchMode/questions";
import type { Question } from "@/lib/questions";

function question(id: string, text: string, difficulty: Question["difficulty"] = "Medium"): Question {
  return {
    id,
    categoryId: "general",
    question: text,
    choices: ["A", "B", "C", "D"],
    correctIndex: 1,
    reference: "Test 1:1",
    explanation: "Reviewed explanation",
    difficulty,
  };
}

function bank(prefix: string, count: number, difficulty: Question["difficulty"] = "Medium") {
  return Array.from({ length: count }, (_, index) => question(`canon-${index + 1}`, `${prefix} ${index + 1}`, difficulty));
}

describe("Church Mode multilingual question selection", () => {
  it("derives the selector from the central registry and shows every Church-enabled language", () => {
    expect(churchModeLanguages).toEqual(enabledChurchModeLanguages(ALL_LANGUAGES));
    expect(churchModeLanguages.map((language) => language.code)).toEqual(ALL_LANGUAGES.filter((language) => language.churchModeEnabled).map((language) => language.code));
  });

  it("keeps centrally disabled Church languages hidden", () => {
    const disabled: LanguageInfo = { ...ALL_LANGUAGES[0], code: "en", churchModeEnabled: false };
    expect(enabledChurchModeLanguages([disabled])).toEqual([]);
  });

  it("prefers a complete native translation and does not label it as fallback", () => {
    const result = selectChurchQuestions("es", [question("canon-1", "Español")], [question("canon-1", "English")], "Medium", 1, false);
    expect(result?.questions[0]).toMatchObject({ id: "canon-1", canonicalQuestionId: "canon-1", question: "Español", languageCode: "es", isEnglishFallback: false });
  });

  it("uses English for the same canonical id when translation is missing or incomplete", () => {
    const incomplete = { ...question("canon-2", "Texto"), choices: ["", "B", "C", "D"] as Question["choices"] };
    const result = selectChurchQuestions("es", [question("canon-1", "Español"), incomplete], [question("canon-1", "English 1"), question("canon-2", "English 2")], "Medium", 2, false);
    expect(result?.questions.map(({ id, languageCode, isEnglishFallback }) => ({ id, languageCode, isEnglishFallback }))).toEqual([
      { id: "canon-1", languageCode: "es", isEnglishFallback: false },
      { id: "canon-2", languageCode: "en", isEnglishFallback: true },
    ]);
  });

  it("excludes canonical questions with neither a complete selected translation nor English", () => {
    const incomplete = { ...question("canon-bad", ""), choices: ["", "", "", ""] as Question["choices"] };
    const result = selectChurchQuestions("fr", [incomplete], [], "Medium", 1, false);
    expect(result).toBeNull();
  });

  it.each([5, 10])("produces exactly %i unique frozen canonical questions", (count) => {
    const result = selectChurchQuestions("fr", [], bank("English", 12), "Medium", count, false);
    expect(result?.questions).toHaveLength(count);
    expect(new Set(result?.questions.map((item) => item.canonicalQuestionId)).size).toBe(count);
    expect(result?.questions.every((item) => item.languageCode === "en" && item.isEnglishFallback)).toBe(true);
    const frozen = result?.questions.map(({ canonicalQuestionId, languageCode, isEnglishFallback }) => ({ canonicalQuestionId, languageCode, isEnglishFallback }));
    expect(result?.questions.map(({ canonicalQuestionId, languageCode, isEnglishFallback }) => ({ canonicalQuestionId, languageCode, isEnglishFallback }))).toEqual(frozen);
  });

  it("blocks selection when exact difficulty coverage cannot reach the configured count", () => {
    expect(selectChurchQuestions("om", [], bank("English", 4), "Medium", 5, false)).toBeNull();
  });

  it("keeps fallback rules stable for a fresh Play Again selection", () => {
    const english = bank("English", 10);
    const native = english.slice(0, 6).map((item) => ({ ...item, question: `Français ${item.id}` }));
    const first = selectChurchQuestions("fr" as LangCode, native, english, "Medium", 10, false);
    const replay = selectChurchQuestions("fr" as LangCode, native, english, "Medium", 10, false);
    expect(first?.questions.map((item) => item.languageCode)).toEqual(replay?.questions.map((item) => item.languageCode));
    expect(first?.questions.filter((item) => item.isEnglishFallback)).toHaveLength(4);
  });
});
