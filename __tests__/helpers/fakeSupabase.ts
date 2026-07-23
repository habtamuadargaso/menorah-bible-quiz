/**
 * Minimal in-memory stand-in for the exact subset of the supabase-js
 * query-builder chain used by lib/questions/loadQuestions.ts and
 * lib/questions/loadQuestionById.ts: `.from(table).select(cols).eq(col,
 * val)...` (awaited directly, no terminal call) or `.maybeSingle()`, plus
 * `.rpc("get_question_answer_keys", ...)`. Not a general Postgrest mock —
 * only supports the filters these two call sites actually use (top-level
 * `column = value` and one level of dotted `relation.column = value` for
 * the embedded `question_translations` resource, with inner-join semantics
 * matching `question_translations!inner(...)`).
 */

export type FakeQuestionRow = {
  id: string;
  level: number;
  category: string;
  book: string;
  chapter: number | null;
  difficulty: string;
  reference: string;
  status: string;
};

export type FakeTranslationRow = {
  question_id: string;
  language_code: string;
  question_text: string;
  choice_1: string;
  choice_2: string;
  choice_3: string;
  choice_4: string;
  reflection: string | null;
  status: string;
};

export type FakeAnswerKeyRow = {
  question_id: string;
  correct_index: number;
  explanation: string;
};

export interface FakeSupabaseFixture {
  questions: FakeQuestionRow[];
  translations: FakeTranslationRow[];
  answerKeys: FakeAnswerKeyRow[];
}

function runQuery(
  fixture: FakeSupabaseFixture,
  filters: { top: Record<string, unknown>; nested: Record<string, Record<string, unknown>> }
) {
  const nestedFilters = filters.nested["question_translations"] ?? {};

  return fixture.questions
    .filter((q) => Object.entries(filters.top).every(([k, v]) => (q as Record<string, unknown>)[k] === v))
    .map((q) => {
      const matchingTranslations = fixture.translations.filter(
        (t) =>
          t.question_id === q.id &&
          Object.entries(nestedFilters).every(([k, v]) => (t as Record<string, unknown>)[k] === v)
      );
      return { ...q, question_translations: matchingTranslations };
    })
    .filter((row) => row.question_translations.length > 0); // `!inner` semantics
}

export function makeFakeSupabaseClient(fixture: FakeSupabaseFixture) {
  function builder(table: string) {
    const filters = { top: {} as Record<string, unknown>, nested: {} as Record<string, Record<string, unknown>> };

    const api = {
      select() {
        return api;
      },
      eq(col: string, val: unknown) {
        if (col.includes(".")) {
          const [rel, nestedCol] = col.split(".");
          filters.nested[rel] = { ...(filters.nested[rel] ?? {}), [nestedCol]: val };
        } else {
          filters.top[col] = val;
        }
        return api;
      },
      maybeSingle() {
        const rows = table === "questions" ? runQuery(fixture, filters) : [];
        return Promise.resolve({ data: rows[0] ?? null, error: null });
      },
      then(
        onFulfilled?: ((value: { data: unknown; error: null }) => unknown) | null,
        onRejected?: ((reason: unknown) => unknown) | null
      ) {
        const rows = table === "questions" ? runQuery(fixture, filters) : [];
        return Promise.resolve({ data: rows, error: null }).then(onFulfilled, onRejected);
      },
    };
    return api;
  }

  return {
    from(table: string) {
      return builder(table);
    },
    rpc(name: string, args: { p_question_ids: string[]; p_lang?: string }) {
      if (name === "get_question_answer_keys") {
        const data = args.p_question_ids.map((id) => {
          const key = fixture.answerKeys.find((k) => k.question_id === id);
          return key
            ? { question_id: id, correct_index: key.correct_index, explanation: key.explanation }
            : { question_id: id, correct_index: null, explanation: null };
        });
        return Promise.resolve({ data, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
  };
}
