import type { Question } from "./types";

// ---------------------------------------------------------------------------
// Swahili question bank — PLACEHOLDER.
//
// This language does not have its own questions yet. The quiz engine does
// NOT fall back to English content for an empty bank (an earlier version
// of this comment incorrectly claimed it did) -- solo campaign and
// Friends Battle both show a clear "not enough content" message instead
// (see lib/questions/index.ts and lib/friendsBattle/localQuestions.ts).
// Real per-language content can also come from public.questions /
// question_translations via Mission 10's translation workflow (Admin ->
// Global Translations) once questions are published there.
//
// To add real Swahili questions: copy the shape from lib/questions/en.ts
// (or lib/questions/am.ts for a second worked example) and fill in
// translated question/choices/explanation text below. Have Bible references
// and any quoted Scripture reviewed by a native speaker / trusted Swahili
// Bible translation before publishing — do not auto-translate verse text.
// ---------------------------------------------------------------------------
export const QUESTIONS_SW: Question[] = [];
