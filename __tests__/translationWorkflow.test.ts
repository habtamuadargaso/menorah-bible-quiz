import { describe, it, expect, vi } from "vitest";
import { makeFakeServiceClient, type FakeRow } from "./helpers/fakeServiceClient";

const state = vi.hoisted(() => ({ client: null as ReturnType<typeof import("./helpers/fakeServiceClient").makeFakeServiceClient> | null }));

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: () => state.client,
}));

import { approveAndPublishTranslations, publishAllTranslationsForQuestions } from "@/lib/admin/translationWorkflow";

function setTables(tables: Record<string, FakeRow[]>) {
  state.client = makeFakeServiceClient(tables);
}

describe("approveAndPublishTranslations", () => {
  it("moves ai_draft/needs_review/approved straight to published, leaving unrelated rows untouched", async () => {
    const tables: Record<string, FakeRow[]> = {
      question_translations: [
        { id: "t-am", question_id: "Q1", language_code: "am", status: "ai_draft" },
        { id: "t-en", question_id: "Q1", language_code: "en", status: "published" }, // English row: must not be touched
      ],
      translation_review_history: [],
    };
    setTables(tables);

    const results = await approveAndPublishTranslations(["t-am"], "Reviewer Name");

    expect(results).toEqual([{ translationId: "t-am", outcome: "published" }]);
    expect(tables.question_translations.find((r) => r.id === "t-am")?.status).toBe("published");
    // The English row's status is untouched — proves publishing another
    // language's translation never overwrites the English parent content.
    expect(tables.question_translations.find((r) => r.id === "t-en")).toMatchObject({ status: "published" });
    expect(tables.question_translations.find((r) => r.id === "t-en")?.language_code).toBe("en");
  });

  it("leaves an already-published translation alone (reported ineligible), never force-republishing it", async () => {
    const tables: Record<string, FakeRow[]> = {
      question_translations: [{ id: "t-am", question_id: "Q1", language_code: "am", status: "published", published_at: "2026-01-01" }],
      translation_review_history: [],
    };
    setTables(tables);

    const results = await approveAndPublishTranslations(["t-am"], "Reviewer Name");

    expect(results[0].outcome).toBe("ineligible");
    expect(tables.question_translations[0].published_at).toBe("2026-01-01");
  });
});

describe("publishAllTranslationsForQuestions (AI Factory approve/publish bulk path)", () => {
  it("publishes every eligible translation of the given questions, including English, without touching another question's rows", async () => {
    const tables: Record<string, FakeRow[]> = {
      question_translations: [
        { id: "q1-en", question_id: "Q1", language_code: "en", status: "ai_draft" },
        { id: "q1-am", question_id: "Q1", language_code: "am", status: "ai_draft" },
        { id: "q2-en", question_id: "Q2", language_code: "en", status: "ai_draft" },
      ],
      translation_review_history: [],
    };
    setTables(tables);

    const results = await publishAllTranslationsForQuestions(["Q1"], "Reviewer Name", "published");

    const ids = results.map((r) => r.translationId).sort();
    expect(ids).toEqual(["q1-am", "q1-en"]);
    expect(tables.question_translations.find((r) => r.id === "q1-en")?.status).toBe("published");
    expect(tables.question_translations.find((r) => r.id === "q1-am")?.status).toBe("published");
    // Q2 belongs to a different question and was never selected for
    // publishing — it must remain untouched.
    expect(tables.question_translations.find((r) => r.id === "q2-en")?.status).toBe("ai_draft");
  });

  it("does not resurrect a translation that was already rejected or archived", async () => {
    const tables: Record<string, FakeRow[]> = {
      question_translations: [
        { id: "q1-en", question_id: "Q1", language_code: "en", status: "ai_draft" },
        { id: "q1-fr", question_id: "Q1", language_code: "fr", status: "rejected" },
      ],
      translation_review_history: [],
    };
    setTables(tables);

    const results = await publishAllTranslationsForQuestions(["Q1"], "Reviewer Name", "published");

    expect(results.map((r) => r.translationId)).toEqual(["q1-en"]);
    expect(tables.question_translations.find((r) => r.id === "q1-fr")?.status).toBe("rejected");
  });
});
