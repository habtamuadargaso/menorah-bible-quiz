# How to Add a Language Safely

## 1. Configure it without exposing it

1. Add the `LangCode` and one `ALL_LANGUAGES` entry in `lib/i18n/locales.ts` with `releaseStatus: "future"`.
2. Add an interface translation module and register it in `lib/i18n/translations/index.ts`. Partial modules are allowed because missing keys fall back to English.
3. For RTL languages set `rtl: true`, but keep the language future-only until RTL QA passes.

Do not add a second language list. Protected admin tools automatically read `ALL_LANGUAGES`; player selectors automatically read only `LANGUAGES`.

## 2. Prepare question content

1. Use one existing `questions.id` as the canonical translation-group ID.
2. Create a `question_translations` row with that `question_id` and the new `language_code`.
3. Keep generated content in `ai_draft`; move it through `needs_review` and `approved` only after editorial/native review.
4. Publish only after Scripture reference, question, all four choices, correct-answer alignment, explanation, and reflection have been reviewed.
5. Never create a new canonical question merely to hold a translation of an existing question.

For local content, use the canonical `BibleQuestion` representation. Do not guess that two independently authored legacy questions are translations; merge only after a reviewer confirms equivalence.

## 3. Prove mode coverage

- UI: no blank strings; English fallback is understandable; direction and typography pass.
- Solo: at least one complete advertised level/category round.
- Friends Battle: at least 10 unique reviewed questions, including difficulty-fallback behavior.
- Live Battle: two clients receive the same `room_question_id`; exact translation or explicit English fallback notice renders; timers/scores remain synchronized.
- Church Mode: 2-player/5-question and 8-player/10-question sessions complete without empty text.
- Run duplicate-ID, translation-status, and question/answer alignment validation.

## 4. Enable only after approval

Change only that registry entry from `releaseStatus: "future"` to `releaseStatus: "enabled"`. Then run selector audits at desktop/mobile widths, native QA, `npm run lint`, `npm test`, `npm run build`, and `git diff --check`.

Never enable a language based solely on machine-generated files or aggregate translation count; reviewed playable coverage and mode-specific QA are the release gate.
