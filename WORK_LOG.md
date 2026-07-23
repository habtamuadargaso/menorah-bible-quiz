# Work Log

## Mission 11 — Fix: published multilingual translations not appearing in gameplay (2026-07-23)

**Root cause.** Two of the three pathways that can make a `question_translations`
row live never actually promoted it to `status = 'published'`, even though
they did flip the parent `questions.status` to `'published'`:

1. **AI Question Factory approve/publish** (`app/api/admin/factory-review/route.ts`)
   only ever updated `questions.status` — it never touched
   `question_translations` at all, so every translation (English included)
   stayed at the column's `'ai_draft'` default forever.
2. **Editorial-to-live publish bridge** (`publish_editorial_question()`,
   `supabase/migrations/20260729_mission9_editorial_publish_bridge.sql`)
   inserted `question_translations` rows with no `status` column specified —
   it predates Mission 10's `question_translations.status` column (added one
   migration later) and was never revisited after that column's `'ai_draft'`
   default started actually gating gameplay visibility.

Global Translations' own workflow (`lib/admin/translationWorkflow.ts`) was
already correct — `approveTranslations`/`publishTranslations` properly
WHERE-guard every transition — it just had no combined "approve straight to
published" bulk action.

**Fixes.**
- `lib/admin/translationWorkflow.ts`: new `publishAllTranslationsForQuestions()`
  (used by the factory-review route to carry every translation of an
  approved/rejected AI-Factory question along with its parent, since that
  pathway has no separate per-language review step) and
  `approveAndPublishTranslations()` (a one-step ai_draft/needs_review/approved
  → published transition for Global Translations' new bulk actions).
- `app/api/admin/factory-review/route.ts`: POST now calls
  `publishAllTranslationsForQuestions()` after updating the parent question.
- `supabase/migrations/20260731_mission11_publish_bridge_translation_status_fix.sql`:
  `publish_editorial_question()` now inserts translations directly as
  `'published'` (with `reviewed_by`/`reviewed_at`/`published_at` populated
  and a `translation_review_history` row per language), plus a one-time
  backfill for any already-published question of either broken pathway whose
  translations are still stuck in `ai_draft`/`needs_review`/`approved`.
- `components/admin/GlobalTranslations.tsx` + `/api/admin/translations/review`:
  new "Approve & Publish Selected" and "Approve & Publish All on Page"
  buttons/action.

Neither fix touches or overwrites the English row's content — every update
is scoped to specific translation ids or specific `question_id`s, and only
ever changes workflow columns (`status`/`reviewed_by`/`reviewed_at`/
`published_at`), never `question_text`/choices/etc.

**Language codes.** Audited `en, am, om, ti, sw, ar, fr, es, de, it, pt, hi,
zh, ja, ko` across `lib/i18n/locales.ts` (the single source of truth),
AI generation, `question_translations`, the language selector, and both
gameplay loaders — all already derive from the same `LANGUAGES` registry,
no mismatches found.

**Gameplay confirmation.** `loadQuestionsForLevel`/`loadQuestionById`
(Solo Play, via `loadQuestionsForGame.ts`) and `get_room_question()`
(Live Battle) already required an exact-language `question_translations.status
= 'published'` row and never coalesce to English — that part was correct
before this mission; the bug was entirely upstream, in how translations
reached (or failed to reach) that status. **Friends Battle is unaffected and
unchanged**: it is still 100% local/offline (`lib/friendsBattle/localQuestions.ts`),
drawing only from the static per-language bank compiled into the JS bundle —
it does not read `question_translations` at all and gains nothing from this
fix (see `QUESTION_PUBLISHING.md`).

**Tests.** No test runner existed in this repo before this mission. Added
`vitest` (`pnpm test`) plus `__tests__/translationGating.test.ts` (proves
draft/approved-not-published translations never appear, a published
translation appears in the exact requested language, a language-code
mismatch returns nothing, and an existing English translation is never
substituted when the requested language has its own published row) and
`__tests__/translationWorkflow.test.ts` (proves the new workflow functions
only ever transition eligible rows and never touch another question's or
language's row, including the English row specifically).

## Mission 10C — Over-generation strategy for AI question reliability (2026-07-22)

Replaced `lib/question-factory/generator.ts`'s "generate exactly N, fail if
validation drops below N" flow with an over-generation strategy.

**Sizing.** First pass now requests `max(N + 5, ceil(N * 1.5))` raw
candidates from Gemini (e.g. 10 → 15, 50 → 75), chunked across calls of
≤30 candidates each (`MAX_CANDIDATES_PER_CALL`) to stay inside Gemini's
output-token budget. If validation still leaves fewer than N valid+unique
questions after that pass, retries request only `missing + 3`
(`RETRY_SAFETY_BUFFER`) more — never another full over-generation batch —
bounded by `MAX_GENERATION_CALLS = 12` total Gemini calls so a pathological
run can't loop forever.

**Validation.** Every raw candidate is still checked by
`validateEnglishCandidate` + `validateGeneratedQuestion` (missing fields,
wrong answer count, non-unique answers, invalid schema) and deduped via the
existing normalized-text comparison (`duplicates.ts`: lowercase, NFKD, strip
punctuation, collapse whitespace). New: `validator.ts` now also rejects a
present-but-malformed or unrecognized Bible reference
(`isValidBibleReference`, format `Book chapter:verse[-verse]` checked
against the canonical 66-book list in `lib/questions/canon.ts`) — previously
only *presence* of a reference was checked, not validity.

**Yield tracking.** Valid+unique candidates are no longer capped at N while
being collected — the full valid pool is kept so diagnostics can report the
true yield (e.g. 13 valid found when only 10 were needed), and only
`slice(0, N)` is returned/saved. The generator throws only if the Gemini
call budget is exhausted with still-too-few valid questions — never while
another retry could plausibly close the gap.

**Diagnostics.** `generateAndSaveQuestions` (and the `/api/questions/generate`
response) now return a `diagnostics` object — `requested`, `generated`,
`valid`, `duplicatesRemoved`, `invalidRemoved`, `returned` — replacing the
old ad hoc `duplicatesRejected` / `invalidQuestionsRejected` /
`generationAttempts` fields (no other caller depended on those field names).

Scope: generation reliability only. Review, publishing, and the database
save path (`database.ts`, `translator.ts`, admin review routes) are
untouched.

## Mission 10 — Global language platform (2026-07-22)

Git checkpoint before this mission: annotated tag `checkpoint-before-mission-10`
at commit `e0496db` (working tree clean; Mission 9 already applied and
verified live per the prior commit).

### Previous language architecture

Three separate, overlapping language-code type definitions existed:
`LangCode`/`LANGUAGES` (`lib/i18n/locales.ts`, 14 languages — the closest
thing to a canonical registry), `SupportedLanguage`
(`lib/question-factory/types.ts`, the same 14 **+ "ja"**, already drifted
out of sync), and `SupportedQuestionLanguage` (`lib/questions/types.ts`,
**en/am only** — a structural property of the editorial `BibleQuestion`
pipeline, not a config value). `components/LanguageSelector.tsx` and
`components/LanguageModal.tsx` each independently hardcoded the same
`LANGUAGES.filter(FULLY_TRANSLATED_QUESTION_LANGS.includes(...))` line.
`app/api/questions/generate/route.ts` had its own third hand-written
15-language allowlist. A **third, previously-undiscovered question
system** was also found during the audit: a per-language static bank
(`lib/questions/<lang>.ts` + `lib/questions/index.ts`, legacy
`Question`/`categoryId` shape) that solo campaign blends with the live DB
via `loadQuestionsForGame.ts`. Only `en.ts` (~100 questions) and `am.ts`
(~10 questions) had real content — the other 12 language files were
`export const QUESTIONS_XX: Question[] = []` stubs whose comments falsely
claimed "automatically falls back to English" (the actual code never did
this — stale documentation, now corrected in all 12 files).

An active, live English-fallback bug was also found in `get_room_question()`
(the RPC serving multiplayer question text): `coalesce(qt.*, qt_en.*)`
silently substituted English whenever the room's language was missing a
translation. `lib/questions/loadQuestionById.ts` had the same bug
client-side (`questionById(lang, id) ?? questionById("en", id)`) but zero
callers anywhere in the app (confirmed by repo-wide search).

Full detail on all of this is in the Phase 1 audit message earlier in this
conversation (schemas, RLS, gameplay query paths for solo/Friends
Battle/online multiplayer, published-question-count query, etc.) — not
re-derived here to keep this log from duplicating it.

### Final architecture

`public.questions` stays the sole question identity; `public.question_translations`
stays the actual per-language content gameplay reads — unchanged shapes,
Mission 10 only adds workflow metadata columns to the latter. Nothing
about the editorial canonical/`admin_imported_questions`/
`question_review_overlay` pipeline (Missions 7-9) changed — it remains
English/Amharic-only by design (per your explicit instruction not to widen
`SupportedQuestionLanguage`); Mission 10's multi-language workflow
operates entirely downstream of it, directly against the live table, using
the already-published English `question_translations` row as its
translation source.

```
question_translations (any language) row lifecycle:
  missing → ai_draft → needs_review → approved → published
                                    ↘ rejected / archived (from most states)

Only status='published' (AND parent questions.status='published') is
ever readable by `authenticated` or served to a player.
```

### Translation lifecycle & rules implemented

- **Generation** (`lib/admin/translationWorkflow.ts::generateTranslations`) only ever reads from a source `question_translations` row with status `approved` or `published` — never `ai_draft`/`needs_review`/`rejected` (requirement: "never translate from a rejected or incomplete translation"). English is the hardcoded default source (`sourceLanguage = "en"` unless explicitly overridden — no UI currently exposes choosing another source, matching the mission's "English by default" framing without over-building an unused option).
- **Idempotency** (`(question_id, language_code)`, matching the table's existing unique constraint): a fresh `ai_draft`/`needs_review`/`approved`/`rejected` row without `force_regenerate` returns `already_exists`, never a duplicate. A **published** row is refused unconditionally, even with `force_regenerate: true` — the only way to replace live content is an explicit `archive` action first, then translate again. A `WHERE status <> 'published'`-guarded UPDATE (not a blanket upsert) closes the narrow race between checking and writing; a `23505` unique-violation on fresh insert is treated the same as `already_exists`.
- **Never treats AI output as reviewed**: every generation lands as `ai_draft`, full stop — `approve`/`reject`/`publish` are separate, explicit admin actions, each re-verifying eligibility server-side via a `WHERE status IN (...)`-guarded UPDATE (never trusting a status the browser last displayed).
- **Editing resets review** (`editTranslation`): changing content on an `approved`/`published`/`rejected` translation resets it to `needs_review` and clears `reviewed_by`/`reviewed_at`/`published_at`/`rejection_reason` — mirroring the editorial pipeline's existing `applyEdit()` rule exactly. This means **editing a published translation immediately takes it out of live rotation** (gameplay only ever serves `status='published'`) — a deliberate safety property: unreviewed content must never stay live, not an accidental side effect.
- **Structural validation** on every generated/edited translation: non-empty question text, exactly 4 non-empty choices, no duplicate choices (case-insensitive), non-empty explanation. Correct-answer position is never at risk of corruption because it isn't stored per-translation at all — `correct_index` lives only on the parent `questions` row, shared across every language; translation only ever supplies `choice_1..4` text in the same fixed positions.
- **Controlled batching**: `generateTranslations` processes a hard-capped list (max 60 question×language pairs per request, enforced in `app/api/admin/translations/generate/route.ts`) with concurrency limited to 3 in flight at a time — never "hundreds of AI requests simultaneously."
- **Quality score**: column exists, always `NULL` for AI-generated rows — Gemini's text-generation API returns no confidence signal, and none is fabricated.

### Database mapping / migration

`supabase/migrations/20260730_mission10_translation_workflow.sql`:
- 9 new nullable columns on `question_translations` per your Decision 1: `status` (`not null default 'ai_draft'`, added via alter+backfill+set-not-null so the default never blindly overwrites existing rows), `source_language`, `translation_provider`, `ai_model`, `generated_at`, `reviewed_by`, `reviewed_at`, `rejection_reason`, `quality_score`, `published_at`.
- **Safe backfill**: existing rows get their `status` derived from their **parent question's** status at migration time (`published→published`, `approved→approved`, `review→needs_review`, `rejected→rejected`, else `ai_draft`) — every currently-playable translation stays exactly as playable as it was before this migration touched anything. Re-running the migration is a no-op for already-backfilled rows (`WHERE status IS NULL` guard).
- **Strengthened RLS** (per Decision 1): the `authenticated` SELECT policy on `question_translations` now requires `status = 'published'` **and** the parent question's `status = 'published'` — previously only the parent's status was checked, meaning an `ai_draft` row was already readable via a raw PostgREST call even before any app code caught up. `service_role` gets an explicit (defensive/idempotent) `UPDATE` grant added to its existing implicit SELECT/INSERT.
- **`translation_review_history`**: new append-only table, identical shape/RLS/grant pattern to Mission 7's `question_review_history` (select+insert only, no update/delete policy for any role, ever).
- **Indexes**: `(language_code, status)` on `question_translations`, `(status)` on `questions` — support both the gameplay filter and the stats/availability aggregate queries.
- **`get_room_question()` rewritten** (per Decision 2): dropped and recreated (changing a `returns table(...)` shape requires this — `CREATE OR REPLACE` can't alter return columns) with the English-coalesce fallback removed entirely. It now joins only the exact requested language and only a `status='published'` translation row, and returns a new `translation_available boolean` column so the caller can distinguish "real content" from "nothing found" — no substitution, ever. `seedRoomQuestions()` already guarantees every seeded question has the room's language published before the room starts, so this is expected to be `true` in all ordinary play; it exists to make the exceptional case (a translation archived mid-battle) loud instead of silently wrong.
- **`get_translation_stats()`**: one aggregate `GROUP BY` RPC backing the stats endpoint and the availability calculation, so neither has to load full question/translation content just to count rows.
- Full rollback instructions are inline as a comment at the top of the migration file.

### Gameplay behavior changes

- **`lib/questions/loadQuestions.ts`** (`loadQuestionsForLevel`, used by solo play and Friends-Battle/Online-Church-Mode room seeding): added `.eq("question_translations.status", "published")` — without this, an `ai_draft` row would have gone live to players the instant it existed, entirely defeating the workflow.
- **`lib/questions/loadQuestionById.ts`** (per Decision 3 — fixed in place, not deleted, despite having zero current callers): removed the `?? questionById("en", questionId)` fallback and added the same `status='published'` filter to its DB query. Requires an exact-language match, DB or static-bank, or returns `null` — never substitutes another language.
- **`get_room_question()`**: see above. **`lib/liveBattleRoom.ts`**'s `RoomQuestionView` gained a `translationAvailable: boolean` field; both `app/multiplayer/host/[code]/page.tsx` and `app/multiplayer/play/[code]/page.tsx` now treat `translationAvailable: false` the same as a failed fetch (log an error, `setQuestion(null)`) rather than rendering a half-null question object. Given `translationAvailable` should be `true` in all ordinary operation, this is a safety net for an exceptional case, not a feature with its own dedicated UI treatment — a fuller "translation unavailable, ask the host" banner would be a reasonable follow-up but wasn't built here to avoid scope creep into several more presentational components under this mission's already very large surface.
- **Friends Battle** (`lib/friendsBattle/localQuestions.ts`, `components/friendsBattle/FriendsBattleSetup.tsx`): confirmed already fully compliant — 100% static-bank-only (never Supabase), already shows all `LANGUAGES` with a real content-check (`hasEnoughFriendsBattleContent`) and a clear error rather than any fallback. **Not modified.** Per your explicit instruction, Friends Battle still does not and must not depend on Supabase — see "Offline limitation" below for what that means for Mission 10's new content specifically.
- **Online multiplayer**: still exactly one language per room, set at creation (per your Decision "keep one exact language per room for Mission 10" — no per-player rendering claimed or built). `seedRoomQuestions()`'s existing requirement (enough exact-language published content or room creation fails with a clear error) is unchanged and now additionally benefits from the strengthened translation-status filter upstream.

### Offline limitation (Friends Battle)

Mission 10's new translation workflow only ever writes to `public.question_translations` (the live DB table). Friends Battle deliberately never reads that table — it only reads the static per-language bundle (`lib/questions/<lang>.ts`), which nothing in this mission populates. **A Spanish translation approved and published via Global Translations today will be playable in solo campaign and online multiplayer, but not in Friends Battle**, until a separate, deliberate bundling step exists (e.g., an admin "export approved translations for a language into a static bundle" action, run at build/deploy time). That's a real, explicit product gap this mission does not close — flagged rather than silently left implicit, exactly as the mission requested.

### API endpoints added

- `POST /api/admin/translations/generate` — single/bulk AI generation. Batch-capped (60 pairs), concurrency-limited (3).
- `POST /api/admin/translations/review` — `approve | reject | publish | archive | regenerate`, ids + action only from the browser.
- `GET /api/admin/translations` — paginated/filterable list (target language, level, status, source type, search) for the Global Translations table; bounded browse-and-filter-in-JS over up to 2000 published questions per request, same pattern `lib/admin/adminQuestions.ts` already uses for the editorial Question Bank.
- `GET /api/admin/translations/detail` + `PATCH /api/admin/translations/[id]` — Translation Editor fetch (keyed by `questionId`+`targetLanguage`, so it works even for a "missing" row with no uuid yet) and edit (keyed by the translation's own uuid, which by definition only exists once a row does).
- `GET /api/admin/translations/stats` — aggregate counts via `get_translation_stats()`, not full-content loads.
- `GET /api/languages/availability` — public, read-only, rate-limited. Backs both language selectors and the Global Translations tab's per-language stat pills.

### Language registry consolidation (per Decision 5)

- `lib/i18n/locales.ts`: added `"ja"` to `LangCode` and a `{code:"ja", nativeName:"日本語", englishName:"Japanese"}` entry to `LANGUAGES`. Added matching stub entries (`lib/questions/ja.ts` — empty static bank, `lib/i18n/translations/ja.ts` — empty UI-string override, both required by existing `Record<LangCode, ...>` types) so the build stays exhaustive. Japanese has no content in either system yet — it will show "Coming Soon" everywhere until real content exists, exactly like the other under-served languages.
- `lib/question-factory/types.ts`: `SupportedLanguage` is now `export type { LangCode as SupportedLanguage } from "@/lib/i18n/locales"` — a re-export, not a second hand-maintained list.
- `app/api/questions/generate/route.ts`: `normalizeLanguages()`'s hardcoded 15-language `Set` replaced with `new Set(LANGUAGES.map((l) => l.code))`.
- `components/LanguageSelector.tsx` / `components/LanguageModal.tsx`: both now render every `LANGUAGES` entry, disabling (with a "Coming Soon" label) any whose `soloAvailable` (from the new `useLanguageAvailability()` hook / `/api/languages/availability`) is false — replacing the old hardcoded `FULLY_TRANSLATED_QUESTION_LANGS` two-language allowlist duplicated in both files.

### Statistics

`GET /api/admin/translations/stats` returns, per language: published/ai_draft/needs_review/approved/rejected/archived counts, a derived `missing` count (`total published questions − sum of all statuses accounted for`), and `completionPercent` (`published / total published questions`). All from one grouped SQL aggregate (`get_translation_stats()`) plus two cheap count queries (total published questions; recent generation failures from `translation_review_history`) — no full question/translation content is loaded to compute any of this.

### Translation Center UI (per Decision 4)

Added as a **new, separate tab** — "🗣️ Global Translations" (`components/admin/GlobalTranslations.tsx` + `components/admin/TranslationEditor.tsx`) — sitting alongside the existing "🌍 Translation Center" tab, which is untouched and keeps doing exactly what it already did (editorial English/Amharic side-by-side QA). The new tab: target-language selector, per-language stat pills, filters (level/status/source-type/search), a paginated table (source preview, target preview, status badge, source badge — "Editorial"/"Imported"/"AI Factory" — last-generated time, reviewer), bulk actions (Translate Selected, Translate All Missing on Page, Approve/Reject/Publish/Regenerate/Archive Selected — one confirmation dialog per action, never per question), and a slide-over Translation Editor (source read-only on the left, editable target on the right, fixed choice ordering with an explicit note that correct-answer position lives on the shared parent question and can't be reordered here, live validation, and the same approve/reject/publish/regenerate/archive actions available per-row).

### AI Factory compatibility

Not touched beyond the language-registry dedup (`normalizeLanguages`) and the shared `getGeminiModel()` export (newly exported, not modified) — generation, Pending AI Review, bulk approve/publish/reject/delete, and direct live question creation all use unchanged code paths. Existing AI-Factory-authored `question_translations` rows are backward-compatible via the safe backfill (parent-status-derived, not a blind default).

### Build/verification

- `npx tsc --noEmit` — clean.
- `npm run build` — clean; all new routes present in the build output (`/api/admin/translations`, `/[id]`, `/detail`, `/generate`, `/review`, `/stats`, `/api/languages/availability`).
- No automated test framework exists in this repo (same situation as Missions 8/9). A standalone script mirroring the real eligibility/idempotency/validation/availability-threshold logic in `lib/admin/translationWorkflow.ts` and `lib/i18n/languageAvailability.ts` ran 19 cases — unsupported language, same-source-as-target, missing source, invalid (ai_draft/rejected) source, valid (approved/published) source, published-always-protected-even-with-force, already_exists vs regenerate-with-force, choice validation (empty/duplicate), and solo/Friends-Battle/online availability thresholds — all passed. Deleted after use.

### Unverified live-Supabase steps

Everything below needs your actual database and a browser session — I cannot execute SQL or drive a live multiplayer room from this environment:
- Running `20260730_mission10_translation_workflow.sql` itself.
- The full 22-item manual checklist from the mission brief (generate → review → approve → publish → confirm same `question_id` → confirm no duplicate live row → confirm Spanish gameplay loads it → regenerate-protection → reject → bulk partial-failure reporting → history append-only → English/Amharic still work → unsupported/unavailable languages blocked in the UI → online multiplayer scoring sync → AI Factory still works → Mission 9 publishing still works).
- Whether `service_role`'s implicit UPDATE privilege on `question_translations` (inferred from existing INSERT/SELECT usage, same reasoning applied successfully in Missions 8/9) actually holds — the defensive explicit grant in this migration should make this moot either way, but it's still an inference, not a confirmed fact, until it runs.
- Real published-question-per-language counts (Phase 1 audit items 11/12) — I gave you the query design, not fabricated numbers.

**Environment variables required**: none new. Translation generation reuses the existing `GEMINI_API_KEY` / `GEMINI_MODEL` (already required for the AI Question Factory) — no new secret, no new provider.

**AI provider usage and limits**: same Gemini endpoint the AI Factory already uses (`lib/question-factory/gemini.ts`, unchanged). New usage source is `generateTranslations()`, capped at 60 question×language pairs per API request with 3-way concurrency — a full "translate everything into every language" run would need to be issued as several requests from the admin UI (one per "Translate All Missing on Page" click, page by page), which is intentional friction against an accidental massive AI bill, not an oversight.

### Remaining risks

1. Migration not yet applied to production — everything above is code-correct and internally consistent but unconfirmed against your actual schema/data until you run it.
2. `soloAvailable`'s DB-content threshold (`>= 10 published translations, anywhere across all levels`) is a scoped approximation of `loadQuestionsForGame.ts`'s real per-category-per-level selection logic, not an exact simulation — documented in `lib/i18n/languageAvailability.ts`'s own comment. A language could show as "available" while still lacking a complete round for every specific category, or vice versa in an edge case.
3. Friends Battle offline gap (above) — real, not fixed, deliberately scoped out.
4. `get_room_question()`'s `translation_available: false` case is handled as a generic "treat like a failed fetch" in the host/player pages rather than a dedicated user-facing banner — reasonable given how rare it should be, but worth a proper UI treatment if it's ever observed in practice.
5. The Global Translations list endpoint scans up to 2000 published questions per request before filtering/paginating in memory (same pattern as the existing editorial Question Bank) — fine at this app's current scale, would need a real paginated SQL query (not a JS-side filter) if the live question count grows into the tens of thousands.

### Release-readiness recommendation

**Not production-ready yet** — the migration must be applied and the manual checklist walked through first, per the mission's own closing instruction ("do not claim Mission 10 complete until the migration is applied and the manual end-to-end language tests pass"). Once that's done, this is a genuinely additive, backward-compatible change: no existing RLS was loosened, no existing route's behavior changed except where explicitly decided (get_room_question's fallback removal, loadQuestionById's fallback removal), and every new write path re-verifies eligibility server-side rather than trusting the client.

## Mission 9 — Unify the question content pipelines (2026-07-22)

Git checkpoint before this mission: annotated tag `checkpoint-before-mission-9`
at commit `9354ff0` (working tree clean at the time).

### Previous architecture (as documented in Mission 8, restated for context)

Two disconnected pipelines:
- **Pipeline A (live gameplay)**: `public.questions` + `public.question_translations`. The AI Question Factory writes here directly (`status:'draft'`), reviewed via `/api/admin/factory-review` (`draft → published | rejected | deleted`). `start_battle()`, `get_question_answer_keys()`, and `lib/questions/loadQuestions.ts`/`loadQuestionById.ts` (used by solo play, Friends Battle, and Online Church Mode room seeding — confirmed by reading all of them, not assumed) all gate strictly on `questions.status = 'published'`. **This table is the only thing any live game mode ever reads.**
- **Pipeline B (editorial review)**: the compiled canonical bank (`lib/questions/store.ts`) + `admin_imported_questions` (JSON-imported drafts), with `question_review_overlay`/`question_review_history` providing a `draft → needs-review → approved → published → rejected → archived` workflow, full validator integration, and an append-only audit trail. Before this mission, marking something "published" here had **zero effect on gameplay** — nothing in any game-serving code path ever read these tables.

### Final architecture

`public.questions` remains the **only** source live gameplay reads from — untouched, RLS untouched, no gameplay code changed. Pipeline B remains the editorial layer, also untouched in its day-to-day editing/validation behavior. What's new is a one-way bridge: an **approved** editorial question can now be turned into a real `public.questions` row, atomically, idempotently, without ever letting the browser dictate what gets published or with what content.

```
Editorial (approved) ──publish_editorial_question()──▶ public.questions (published)
     ▲                         RPC, atomic                        │
     │                                                             │
     └── question_review_overlay.status flips to 'published' ◀────┘
         (same transaction as the live insert — can never desync)
```

### Database mapping

Added to `public.questions` (all nullable — every existing AI-Factory row gets `NULL`, meaning "not from the editorial bridge"; requirement 9's "nullable defaults for existing records"):
- `source_question_id text` — the editorial `BibleQuestion.id` this row was published from.
- `source_type text check (source_type is null or source_type in ('canonical','imported'))` — which editorial store `source_question_id` refers to.
- `published_by text` — reviewer name who triggered the publish (source metadata).
- `source_category text` — `BibleQuestion.category` (free-form narrative tag, e.g. "Creation") — preserved for fidelity only, no gameplay code reads it.
- `source_tags text[]` — `BibleQuestion.tags` — same, fidelity-only.

`BibleQuestion.canonicalCategory → questions.category` (per your Decision 1) — this matches what the AI Factory already writes there today (`"Old Testament"`/`"New Testament"`), rather than the free-form narrative `category` field, which has its own new `source_category` column instead.

**Idempotency, enforced at the database level** (requirement 3): `create unique index questions_source_mapping_idx on questions (source_type, source_question_id) where source_question_id is not null`. A given editorial question can map to at most one live row, full stop — not just a client-side check.

**Live id**: deterministic, `'EDITORIAL-' || source_question_id` — human-debuggable, and gives a second (PK-level) idempotency backstop alongside the explicit index.

**Full field preservation** (requirement 4) — language, question text, all 4 choices, correct answer, reference, category (via canonicalCategory), book, difficulty, explanation, source metadata, review status, publication status are all carried through; `reflection` is always `null` on bridge-published rows because the editorial `QuestionTranslation` type never had a reflection field to preserve (`lib/questions/types.ts` — confirmed, not assumed). Translation/group relationship: both pipelines already use the identical "one parent id → N per-language child rows" shape (`BibleQuestion.id` + `.translations{lang}` on the editorial side; `questions.id` + `question_translations` rows on the live side) — so `source_question_id` *is* the translation-group linkage; no separate group-id concept was needed or invented.

### Publication lifecycle

1. Admin clicks **Publish** (single, in `QuestionReviewPanel`) or **Publish Approved** (bulk, in `QuestionBank`'s Review Queue toolbar) — both now go through the same bridge; per your Decision 2, this is the *existing* action repurposed, not a second button.
2. Server (`lib/admin/publishBridge.ts`, gated by `isAuthorizedAdmin()`) re-loads the current editorial record fresh via `getAdminQuestionById()` — never trusts anything from the request body except which ids to attempt (requirements 5 and 13).
3. Eligibility gate (blocks *before* any DB write): `review.status !== 'approved'` → ineligible (covers draft/needs-review/rejected/archived); `validation.errorCount > 0` → ineligible (covers "invalid" even if marked approved); missing/incomplete English translation → ineligible.
4. Secondary content-duplicate check against live `questions` (same level + reference + normalized English text, excluding this question's own mapping) → `skipped_duplicate` if found, using the reused `normalizeText()` from `lib/question-factory/database.ts` (one shared normalizer across pipelines instead of a third reimplementation).
5. `publish_editorial_question()` RPC: re-checks `question_review_overlay.status = 'approved'` itself (closes the gap since step 2's read), then atomically inserts into `questions` + `question_translations` + flips the overlay to `'published'` — all in one Postgres transaction.
6. `question_review_history` gets a "publish attempted" row *before* step 5, and a "publish result: `<outcome>`" row *after* — both batched inserts (one per bulk call, not one per question), both best-effort (a logging failure never blocks the actual outcome from being returned, same precedent Mission 8 set).

### Failure behavior

- If the RPC's own DB write fails partway (e.g. a translations insert violates a constraint), the **entire transaction rolls back** — the live row is never left half-written, and the overlay never ends up saying "published" while nothing is actually live. This is Postgres's ordinary single-transaction-per-function-call semantics, not custom rollback code.
- If the RPC calling itself throws (network blip, etc.), the Next.js layer catches it and returns outcome `"failed"` with the underlying message — reported per-question in bulk results, never silently swallowed.
- A `"published"` overlay status with `live.isLive === false` (checked via `loadLiveMappingStatus()`, a live query against `questions.source_question_id`) can now only mean a prior publish attempt failed after logging its intent — the UI shows this as **"Publish failed"**, distinct from "Published / Live."

### Duplicate behavior

Two layers, exactly matching requirement 10's instruction to make source-mapping authoritative and content-matching secondary:
1. **Authoritative**: the `(source_type, source_question_id)` unique index — re-publishing the same editorial question is caught inside the RPC (checked first, and backstopped by a `unique_violation` exception handler for the concurrent-race case) and reported as `already_live`, never a duplicate insert.
2. **Secondary/warning**: normalized-English-text + reference + level match against any *other* live row (regardless of its own source mapping) → `skipped_duplicate`. This never blocks on its own if there's no source-mapping conflict *and* no content conflict.

### Translation behavior

Investigated before coding (requirement 11): editorial translations are **not** separate rows/ids — `BibleQuestion.translations` is a per-language dictionary property on the one canonical id. Confirmed no existing "translation group id" concept anywhere in the codebase to preserve. The bridge publishes one `question_translations` row per language present and structurally complete (question text + 4 choices + explanation) in the source; English is required for eligibility, every other present language is best-effort (a language missing an explanation is silently excluded from that specific publish, not fatal to the whole operation — matches requirement 4's "explanation, if available"). Each inserted row's `language_code` is taken directly from the source translation key, so a translation can never land under the wrong language.

### Migrations created

- `supabase/migrations/20260729_mission9_editorial_publish_bridge.sql` — the 5 new nullable columns + check constraint + partial unique index + `publish_editorial_question()` SECURITY DEFINER function, `EXECUTE` granted to `service_role` only (never `authenticated` — this is unreachable from the browser, same as every other admin RPC in this codebase). Idempotent (`IF NOT EXISTS`/`OR REPLACE`/guarded `DO` block for the constraint). Rollback instructions are inline as a comment at the top of the file (drop function → drop index → drop columns; safe only if no bridge-published rows exist yet, since dropping the columns loses their provenance, though never any player-visible content).

### Manual Supabase steps required

**Run `20260729_mission9_editorial_publish_bridge.sql` once in the Supabase SQL Editor.** Nothing in this mission works until that's applied — every route change here calls the new RPC, which won't exist until the migration runs.

(The four Mission 8 migrations, if not already applied, are still prerequisites too — see that section below.)

### Files modified/created

- **New**: `supabase/migrations/20260729_mission9_editorial_publish_bridge.sql`, `lib/admin/publishBridge.ts`, `app/api/admin/publish-reviewed/route.ts` (dedicated endpoint per requirement 13's suggested design — also the single implementation the existing routes below call directly, not over HTTP), `lib/admin/statusLabel.ts` (shared status-label/tone helper, requirement 8).
- **`lib/admin/types.ts`**: `AdminQuestionView` gains `sourceType: "canonical" | "imported"` and `live: { isLive, liveQuestionId, liveStatus }`; new `PublishOutcome`/`PublishResult` types.
- **`lib/admin/reviewStore.ts`**: added `loadLiveMappingStatus()`; removed `bulkPublishApproved()` (its only caller now calls the bridge instead — confirmed via grep before deleting); `bulkDeleteImportedQuestions()` now also skips (never deletes) anything with review status `'published'`, matching the same guard the AI Factory's own delete already applies, now that "published" can mean a real live row exists.
- **`lib/admin/adminQuestions.ts`**: `getAllAdminQuestions()` now also loads the live-mapping status and imported-id set, populating `sourceType`/`live` on every `AdminQuestionView` (one extra batched query, run in parallel with the existing two).
- **`app/api/admin/questions/[id]/review/route.ts`**: `status: "published"` now calls the bridge instead of a bare overlay update; other statuses unchanged.
- **`app/api/admin/bulk/route.ts`**: `action: "publish"` now calls the bridge and returns per-item `results` (was `{published, skipped}`); doc comment updated to explain why `"publish"` is no longer in scope for Undo Last Bulk Action.
- **`components/admin/QuestionBank.tsx`**: status badge now uses the shared `reviewStatusLabel`/`reviewStatusTone` (Draft / Needs review / Approved (not live) / Published / Live / Rejected / Archived / Publish failed); new small "Editorial"/"Imported" source badge under each row's id (your requested optional polish — labels only these two, since AI-Factory-authored rows structurally never appear in this list, see below); "Publish Approved" now shows a confirmation dialog and an outcome-count summary (`"12 published · 2 already live · 1 skipped (duplicate) · 0 ineligible · 0 failed"`); `"publish"` removed from `UNDOABLE_ACTIONS`.
- **`components/admin/QuestionReviewPanel.tsx`**: same shared status label/tone; single-question "Publish" now shows a confirmation dialog before calling the bridge.

### Verification results

- `npx tsc --noEmit` — clean.
- `npm run build` — clean; new route `/api/admin/publish-reviewed` present in the build output.
- Targeted logic verification (no test framework exists in this repo — same approach as Mission 8's count-validation check): a standalone script mirroring the eligibility gate, the deterministic-id derivation, and the content-duplicate normalizer ran 9 eligibility cases (draft/needs-review/rejected/archived/invalid/missing-English/incomplete-choices/blank-explanation all blocked; approved+valid+complete allowed) plus idempotent-id and normalization checks — all passed. Deleted after use, per this repo's "no stray scratch files" norm.
- Grepped for every file referencing `AdminQuestionView` before finishing, to make sure the two new required fields didn't leave some other construction site broken — confirmed only `adminQuestions.ts` constructs it; everything else only reads it, and `tsc`/`build` passing is the actual proof.

### Unverified live-Supabase steps (need the real database to confirm)

The manual verification checklist's 20 items split into what's verified by reading/reasoning about the code above vs. what genuinely needs a live Supabase + browser session:
- Items 1–9, 14 (create/publish/re-publish/draft-blocked/rejected-blocked, live row shape, gameplay pickup) — logic verified via the standalone script and the RPC's design above, but **not exercised against a real database from this environment.**
- Item 15 (bulk mixed-selection per-item results) — the code path returns exactly this shape; not run live.
- Item 16 (history append-only) — the RPC never touches `question_review_history`, and `publishBridge.ts` only ever `.insert()`s there, never updates/deletes; the table's own grants still have no UPDATE/DELETE policy for any role. Not observed live.
- Items 17–20 (start_battle() picks up the new row, AI Factory still works, existing live questions unchanged, no RLS errors) — reasoned through above (no RLS policy touched; AI Factory's own insert/update/delete paths are untouched by this migration; existing rows only gain `NULL` in 5 new columns) but not run live.

**You'll need to run the migration and walk through the checklist yourself once** — I don't have a way to execute SQL against your actual Supabase project from here.

### Remaining risks

1. **The migration hasn't run against your actual database yet.** Everything above is code-correct and internally consistent, but "correct in review" and "confirmed against production schema" are different claims — I'm not claiming the latter.
2. **Content-duplicate check cost**: `findContentDuplicate()` queries `questions` filtered by `level` + `reference` (no index on either) on every publish attempt. Fine at this app's current scale (a few hundred/thousand rows); would want an index on `(level, reference)` if the live table grows substantially.
3. **TOCTOU on content, not just status**: the RPC re-checks `question_review_overlay.status` at write time, but does *not* re-fetch and re-diff the actual question content (choices/text/etc.) between the route's read and the RPC's write. In an admin-only, human-paced workflow this window is extremely unlikely to matter, but it's a real, narrower residual gap versus a fully content-versioned re-check.
4. **`bulkDeleteImportedQuestions`'s new "skip if published" guard checks the overlay status, not the live-mapping table directly** — consistent and conservative, but means a hypothetical future state where overlay says `'published'` with no matching live row (shouldn't happen given the atomic bridge, but see risk 1) would still correctly block deletion; the reverse (overlay somehow *not* saying published while a live row exists) can't happen by construction since only the bridge ever creates live rows, and it always sets the overlay in the same transaction.
5. **AI-Factory-authored rows never appear in the Question Bank**, so the "Source" badge can only ever show "Editorial" or "Imported" there — not a bug, just a scope boundary worth knowing about if "AI Factory" was expected to be visible in that specific list.

### Recommended Mission 10

With the bridge in place, the natural next step is closing the loop on the *other* direction: today, editing an already-`approved`-and-published editorial question resets its status to `needs-review` (existing `applyEdit()` behavior) but does **not** touch or un-publish the live row — so a live question can end up out of sync with its (now-edited, not-yet-republished) editorial source. Options worth deciding deliberately (not guessing): (a) leave this as-is and rely on admins noticing "Published / Live" + a subsequent edit means "republish when ready," (b) add a visible "content changed since publish" indicator by comparing a content hash/timestamp, or (c) something else. Also worth revisiting: whether solo campaign should eventually read from `public.questions` too (today it's `getCanonicalQuestionStore()`, entirely separate from both the live-battle table and this bridge), which would be a substantially larger change than this mission and deserves its own explicit go/no-go.

## Mission 8 Part 2 — Pending AI Review bulk actions (2026-07-22)

Follow-up request: the AI Factory's "Pending AI Review" list (the *live-facing*
pipeline — see the architecture finding below) still required approving/
rejecting every AI-generated question one at a time. Added bulk selection and
three batch actions, matching the pattern already built for the Review Queue
but adapted to this pipeline's different backend (no overlay table, no
built-in undo, real deletes cascade).

**`components/ui/Toast.tsx`** (new) — small reusable success/error toast
stack (fixed bottom-right, auto-dismiss after 5s, manually dismissible). No
existing toast primitive in the codebase to reuse; built minimal rather than
pulling in a dependency.

**`app/api/admin/factory-review/route.ts`**:
- Now requires `reviewer` in the request body (400 if missing/blank),
  matching every other review-action route in the admin platform.
- Added a `"deleted"` status value, handled as a real row delete rather
  than a status update (the `questions.status` check constraint has no
  `'deleted'` value — this is a branch in the route, not a DB value).
  **Server-side guard**: fetches current status for the requested ids
  first and only deletes rows that are *not* `published` — anything
  already live is skipped and reported back, never deleted, protecting
  permanent multiplayer question ids (CLAUDE.md rule 4) even against a
  stale client-side selection. `question_translations` rows cascade-delete
  automatically via the existing FK constraint.
- Added `logAudit()`: batches one `question_review_history` row per
  affected question into a single `insert([...])` call after every
  publish/reject/delete. This pipeline has no overlay/history table of its
  own (see the architecture note below), but `question_review_history` is
  a generic append-only log keyed by a free-text `question_id` — reusing
  it here costs nothing and finally gives this pipeline a real audit trail.
  Audit-log failures are logged server-side but never fail the underlying
  action (an audit write hiccup shouldn't block a real review decision).
- All three actions remain single batched requests over however many ids
  are selected — no per-question round trips.

**`supabase/migrations/20260728_mission8_factory_bulk_delete_grant.sql`**
(new) — defensive `grant delete on public.questions to service_role`.
Not proven necessary (this table's existing UPDATE already works without
an explicit grant, suggesting service_role already has full privileges
here from before the Mission 7 tables' grants went missing), but cheap,
idempotent insurance against the same "permission denied" class of bug
this session already hit twice for other tables.

**`app/admin/questions/page.tsx`** — now passes `reviewer` into
`<AIQuestionFactory>` (previously only received `secret`; needed so the
audit trail records who acted, matching every other tab).

**`components/admin/AIQuestionFactory.tsx`**:
- Checkbox per pending question + a header "Select All" checkbox + live
  "N selected" count.
- Three bulk buttons: **Approve & Publish Selected**, **Reject Selected**,
  **Delete Selected** — each disabled while any bulk action is in flight
  (and disables the per-row buttons/checkboxes too, to prevent overlapping
  mutations against the same rows).
- One dialog per action: `window.confirm` for publish/delete (explaining
  the real consequence — "visible to real players immediately" /
  "cannot be undone"), one `window.prompt` for reject that supplies the
  single reason applied to every selected question (Cancel aborts, same
  as a confirm would).
- On completion: selection is cleared, the list is reloaded from the
  server (not just spliced client-side, so it reflects any other admin's
  concurrent changes too), and a success or error toast is shown.
- Existing single-question "Approve & Publish" / "Reject" buttons per row
  are unchanged in behavior, just now also send `reviewer` (required
  server-side) and show a toast on completion.

### Build/verification (Part 2)
- `npx tsc --noEmit` — clean.
- `npm run build` — clean.
- No RLS policy touched; the new migration only adds a privilege grant.
  `question_review_history` keeps its append-only guarantee (still no
  UPDATE/DELETE grant for any role).

### Remaining issues (Part 2)
- **Run the new migration**
  (`20260728_mission8_factory_bulk_delete_grant.sql`) in the Supabase SQL
  Editor — everything else in this batch works without it (existing
  UPDATE-based actions are unaffected), but bulk/single Delete will fail
  with "permission denied" if the inferred implicit grant turns out not to
  exist.
- No undo for this panel's bulk actions (unlike the Review Queue). Wasn't
  requested here, and reversibility for a real DELETE against a table with
  no overlay/snapshot mechanism would need meaningfully more design than
  this pipeline currently has — flagging rather than guessing at it.

## Mission 8 — Admin Platform improvements (2026-07-22)

Autonomous session working from a standing mission: complete the Review
Queue's bulk actions, improve the AI Question Factory, fix bugs, improve
UI/UX, remove temporary debug code, keep security/RLS intact, preserve
existing functionality.

### Architecture finding (read this before touching admin/question code)

The codebase has **two separate, disconnected content pipelines**, discovered
while investigating why "Review Queue" felt incomplete:

1. **Live-facing pipeline**: `public.questions` + `public.question_translations`
   (Supabase tables). The AI Question Factory (`/api/questions/generate`)
   writes here as `status: 'draft'`. `start_battle()` in
   `supabase/migrations/20260719_online_live_battle.sql` only ever selects
   `status = 'published'` rows into a live multiplayer room — **this table is
   the actual gate for what real players see.** It's reviewed via the
   AI Factory's own "Pending AI Review" list → `/api/admin/factory-review`,
   which only supports `draft → published | rejected` (no intermediate
   "approved" staging step, no validator pass, no append-only audit history).

2. **Editorial/canonical pipeline**: the static TypeScript bank
   (`lib/questions/*`) plus `admin_imported_questions` (JSON-imported
   drafts), with a much richer review workflow —
   `draft → needs-review → approved → published → rejected → archived`,
   full validator integration, per-field edit-before-publish, and an
   append-only `question_review_history` audit trail. This is what the
   Question Bank / Review Queue / Translation Center / Validation /
   Duplicates / Statistics tabs all operate on.

**These do not feed each other.** `lib/questions/selectByCriteria.ts` (the
function that would wire the canonical store into actual solo/Friends
Battle/Live Battle gameplay) is explicitly documented in its own comment as
"deliberately NOT called from any of those three today" and confirmed by
grep to only be used from admin API routes. So approving/publishing a
JSON-imported question in the Review Queue currently has **no effect on
what any player ever sees** — it only updates administrative/editorial
state. This was true before this session and is unchanged by it; flagging
it here because it directly shapes what "complete the Review Queue" can
mean without a much larger, riskier change (see Remaining Issues below).

Given this, this session's Review Queue work makes that pipeline's own
editorial workflow fully-featured and correct on its own terms, and treats
the *AI Factory's* pipeline as the one that needs more operational care
(confirmation before publish, mandatory reject reasons) since it is the one
actually gating live content.

---

### 1. Removed temporary debug code

- **`lib/admin/session.ts`** — removed the `[ADMIN DEBUG]` `console.log`
  calls added earlier this session to diagnose an admin-login issue (now
  confirmed resolved). File is back to its pre-debug state. No logic
  changed.

### 2. Review Queue — bulk actions completed

**`lib/admin/reviewStore.ts`** — added four functions:
- `bulkPublishApproved(questionIds, reviewer)` — only transitions questions
  currently `approved` → `published` (mirrors the single-question rule in
  `app/api/admin/questions/[id]/review/route.ts`); anything else selected
  is skipped and reported back, never force-published.
- `bulkDeleteImportedQuestions(questionIds, reviewer, reason)` — **only**
  deletes rows that actually exist in `admin_imported_questions`. Any
  selected canonical (static TypeScript bank) question is skipped, never
  deleted — the canonical store is source code, not dashboard-editable data
  (CLAUDE.md: "never modified by this dashboard"; also rule 1, "never
  delete working features"). Appends a `question_review_history` entry
  *before* deleting, so the append-only audit trail survives the deletion
  of the content it describes. Returns the full deleted payloads so the
  caller can offer an undo.
- `restoreDeletedQuestions(questions)` — re-inserts previously-deleted
  payloads (thin wrapper over the existing `appendImportedQuestions`
  upsert).
- `bulkRestoreReviewState(items, actingReviewer)` — the core of Undo Last
  Bulk Action. Writes each question's overlay back to the *exact* review
  state captured client-side immediately before the bulk action ran.
  Does **not** edit or delete any existing history row (the table has no
  update/delete RLS policy by design); it appends a new "bulk action
  undone" history entry instead, so the audit trail shows both the
  original action and its reversal.

**`app/api/admin/bulk/route.ts`** — added `publish`, `delete`, and
`restore` actions alongside the existing `approve` / `reject` /
`needs-review` / `archive` / `add-tag` / `set-category`. `delete` requires
a non-empty `reason` (same bar as `reject`). Updated the file's doc
comment, which previously said delete was deliberately excluded
("never permanently delete without confirmation... archive is the only
destructive-adjacent action") — explained why that's now safely narrower
in scope (imported-drafts-only) rather than silently contradicting it.

**`components/admin/QuestionBank.tsx`** (this is what both the "Question
Bank" and "Review Queue" nav tabs render, filtered differently) — added:
- **Select All** — explicit toolbar button (the header checkbox already
  did this; added a clearly-labelled button too for discoverability),
  plus **Clear selection**.
- **Approve All on Page** — one click, confirms, approves every row on
  the current page regardless of what's checked.
- **Publish Approved** — bulk-publishes only the selected rows currently
  in `approved` status; reports how many were skipped and why.
- **Delete Selected** — requires a typed reason, then a confirmation
  dialog; only removes AI-imported drafts, explains in the UI that
  canonical rows in the selection are skipped rather than silently
  failing.
- **Undo Last Bulk Action** — appears after any of
  approve/reject/needs-review/archive/publish/delete selected/all-on-page
  runs. Snapshots each affected row's review state (and, for delete, full
  content) from already-loaded page data *before* the request goes out,
  so it has something to restore. Deliberately scoped to these six
  actions — "add tag" and "change category" don't produce an undo
  snapshot (their overlay `edits` shape isn't captured here); noted below
  as a possible follow-up rather than silently half-implemented.
- Result messaging (e.g. "8 question(s) deleted. 2 skipped — not
  AI-imported drafts.") so skip counts aren't invisible.

**New migrations** (must be run once in the Supabase SQL Editor before
Delete Selected will work — see Remaining Issues):
- `supabase/migrations/20260726_mission8_review_queue_delete_grant.sql` —
  grants `service_role` DELETE on `admin_imported_questions` and
  `question_review_overlay`. The prior Mission 7 hotfix
  (`20260725_mission7_admin_grants_hotfix.sql`) deliberately withheld this
  because nothing used it yet; `bulkDeleteImportedQuestions` now does.
  `question_review_history` is untouched — still SELECT/INSERT-only for
  every role, preserving its append-only guarantee even against
  `service_role` (which bypasses RLS, so the *grant* itself is the only
  thing enforcing immutability there).

### 3. AI Question Factory improvements

**`components/admin/AIQuestionFactory.tsx`**:
- Publishing from "Pending AI Review" now requires an explicit
  confirmation ("It becomes visible to real players in live games
  immediately") — this list has no "approved-but-not-published" staging
  state the way the Review Queue does, so a single click was previously a
  one-way door straight to production with no double-check.
- Rejecting now requires a typed reason (previously none was collected at
  all).
- Added a manual **Refresh** button and a loading state for the pending
  list.
- Updated the section's help text to be accurate about what this list
  actually does (see architecture finding above) instead of describing it
  identically to the Review Queue.

**`app/api/admin/factory-review/route.ts`** + new migration
`supabase/migrations/20260727_mission8_factory_reject_reason.sql` — added
a `rejected_reason` column to `public.questions` (nullable, additive,
no RLS/grant change needed) and wired the route to store the reason
supplied above. Previously a reason had nowhere to be persisted, so
requiring one client-side without this would have been theater — it
would've been collected and silently discarded.

### 4. Bugs fixed

- **`components/admin/AdminSettings.tsx`** — the "Development information"
  panel described the *pre-Mission-7* architecture as current: "shared-secret
  header... same mechanism the AI Factory already used," "stored in
  data/admin/review-state.json (server filesystem, not a database)."
  Mission 7 replaced all of this (real per-user Supabase auth as the
  primary path, Supabase-backed storage) months before this session, but
  the settings panel kept telling admins the old story. Rewrote it to
  match reality, and added a note about the two-pipeline split above so an
  admin reading this panel isn't surprised by it later.
- **`components/admin/StatisticsPanel.tsx`** — fetch failures were
  silently swallowed (`.finally()` with no `.catch()`): `loading` would
  clear but `stats` stayed `null`, so the whole page just rendered
  nothing with no indication anything had gone wrong. Added an error
  state with the same `ErrorBanner` + retry pattern every other admin tab
  already uses.

### Build/verification

- `npx tsc --noEmit` — clean.
- `npm run build` — clean (one lint pass fixed: two `react/no-unescaped-entities`
  errors from literal quote marks in new JSX copy, switched to
  `&ldquo;`/`&rdquo;`).
- No existing routes, components, or database policies were removed or
  weakened. All new SQL is additive (new `GRANT` statements, one new
  nullable column) — no RLS policy was loosened, and `question_review_history`
  keeps its append-only guarantee.

### Remaining issues / recommended next steps

1. **Run the two new migrations** in the Supabase SQL Editor before using
   Delete Selected or AI-Factory reject reasons in production:
   - `supabase/migrations/20260726_mission8_review_queue_delete_grant.sql`
   - `supabase/migrations/20260727_mission8_factory_reject_reason.sql`
   Both are idempotent and additive; safe to run alongside existing data.
2. **The two-pipeline split (see above) is the biggest real gap** and
   deliberately was *not* architecturally merged in this session — that's
   a product decision (which pipeline should be canonical? does solo
   campaign move from build-time-static to a runtime Supabase read? how do
   permanent multiplayer question IDs get preserved through a migration?)
   with real live-gameplay blast radius, not something to guess at
   unattended. Recommend deciding, with the person who owns product
   direction, whether: (a) the AI Factory should start writing into the
   canonical/imported pipeline instead of `questions` directly, (b) the
   Review Queue's approvals should be taught to also write into
   `questions`, or (c) the two are intentionally kept separate long-term
   (e.g. `questions` for procedurally-generated/live content,
   canonical bank for curated content) and the UI should say so more
   loudly than it currently does.
3. **Undo Last Bulk Action doesn't cover "Add tag" / "Change category."**
   Scoped out deliberately (see above) rather than half-implemented under
   time pressure. A follow-up could extend `bulkRestoreReviewState` to
   also snapshot/restore `edits.tags` and `edits.canonicalCategory`.
4. **The AI Factory's "Pending AI Review" list has no bulk actions** (no
   select-all/approve-all there) — out of scope for this session to avoid
   duplicating the Review Queue's bulk machinery against a structurally
   different backend (no overlay/history tables for this pipeline). Worth
   revisiting once/if the two pipelines are unified per point 2.
5. Pre-existing, unrelated to this session: the AI Factory's `questions`
   table pipeline still has no per-field edit-before-publish and no
   validator pass before going live — only the canonical/overlay pipeline
   has those. Not fixed here because it's the same architecture question
   as point 2.
