# Multilingual Architecture

Date: 2026-08-05

## Central configuration

`lib/i18n/locales.ts` is the single language registry.

- `ALL_LANGUAGES` contains every locale known to translation tooling.
- Each entry has an explicit `releaseStatus`: `enabled` or `future`.
- `LANGUAGES` and `SUPPORTED_LANGUAGE_CODES` contain only player-facing languages enabled for the current release.
- `CONFIGURED_LANGUAGE_CODES` contains the full future-ready registry.
- Version 1.0 enables only `en` and `am`. A stale saved future locale is rejected and resets to English.

Ordinary selectors consume `LANGUAGES`: Header/Settings, Solo, onboarding, Friends Battle, Live Battle host/join/player lobby, and Church Mode. Protected admin translation and question-generation tools consume `ALL_LANGUAGES`, allowing content preparation without exposing a locale to players.

## Interface language versus question language

These are separate concepts:

- Interface language selects UI strings and document direction. UI modules live in `lib/i18n/translations/`. `LanguageContext` deep-merges a partial locale over English, so a missing interface string cannot render empty.
- Question language selects Bible question text and choices. Local question sources live in `lib/questions/<code>.ts`; reviewed production translations live in `public.question_translations`.

`InterfaceLanguageCode` and `QuestionLanguageCode` aliases make the distinction explicit. Version 1.0 intentionally keeps the existing single player control, so both normally use the same enabled code. Live Battle already stores each player's question language separately from the room language. Church Mode stores a session question language in its local settings.

## Question identity and publication

The canonical model is one question identity with localized children:

- Local canonical `BibleQuestion.id` is the stable canonical source/translation-group ID.
- `BibleQuestion.translations[languageCode]` stores localized text.
- `BibleQuestion.translationStatus[languageCode]` stores `complete`, `machine`, or `missing` independently from canonical `verified` status.
- Legacy per-language files are adapted by `legacyMigration.ts` into canonical records. Because old English and Amharic files were authored independently, the adapter does not invent cross-language equivalence; each gets an honest stable canonical ID until a reviewer merges confirmed equivalents.
- Supabase `questions.id` is the canonical ID. `question_translations` has `question_id`, `language_code`, a unique `(question_id, language_code)` constraint, and workflow `status`. Both parent question and translation must be `published` before player reads.
- `room_questions.question_id` pins one canonical question for every Live Battle client. Players may render different translations, but never receive different question IDs.

No schema change was required.

## Fallback and empty-content safety

- Interface strings: partial locale → English via deep merge.
- Live Battle: latest RPC requests the player's language, falls back to a published English row, and returns `translation_available = false`; host/player screens show the existing limited-language notice.
- Solo and Friends Battle: only published exact-language database rows are merged with the same-language local bank. They require a complete round and show the existing unavailable-content state instead of serving an empty or mixed-language question.
- Church Mode: Version 1.0 only offers English/Amharic and uses the same complete-round loader as Solo. Session creation stops with a clear loading error if a complete question set cannot be formed.

This preserves gameplay and prevents empty questions. Before enabling any future language, its reviewed content must be sufficient for each advertised mode; English fallback is already safe and explicit in Live Battle and UI chrome, while local modes deliberately avoid silently mixing question languages.
