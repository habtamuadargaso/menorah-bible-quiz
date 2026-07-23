# Question Content: Source of Truth & Publishing (Mission 7 Parts 6 & 7)

> **Mission 11 update**: store #2 (`questions` / `question_translations`) has
> its own per-translation `question_translations.status` workflow
> (`ai_draft -> needs_review -> approved -> published`, or
> `rejected`/`archived`) layered on top of the parent `questions.status`
> described below — see "Translation workflow" further down. Both the parent
> question AND its per-language translation row must be `'published'`
> before a player sees it; Mission 11 fixed two pathways
> (`app/api/admin/factory-review/route.ts` and the editorial
> `publish_editorial_question()` RPC) that published the parent question
> but left its translations stuck at `ai_draft` forever. **Friends Battle
> still does not read this table at all** (see store #1 below) — nothing in
> Mission 11 changes that; a translation approved and published here is
> playable in Solo Play and Live Battle, never in Friends Battle.

This app currently has **three separate question content stores**. That's confusing enough to be worth documenting precisely, verified against the code (not assumed) — and precisely which one "Published" affects for each, since the word is used in two unrelated systems.

## The three stores

### 1. Legacy static arrays — `lib/i18n/translations/en.ts`, `am.ts` (exposed via `lib/questions/index.ts`)

- **Consumed by**: Friends Battle exclusively (`lib/friendsBattle/localQuestions.ts`), and as a fallback/supplement in solo play (`lib/questions/loadQuestionsForGame.ts`).
- **Compiled into the JS bundle** at build time — no database, no review workflow, no runtime "publish" step of any kind. Whatever is in the file ships to every player the moment it's deployed.
- **Editing**: requires a code change + redeploy. Not touched by the admin dashboard at all.

### 2. Supabase `questions` / `question_translations` tables

- **Consumed by**: solo play (primary source, `lib/questions/loadQuestions.ts`) and Live Battle.
- **Populated by**: the AI Question Factory (`/api/questions/generate`, admin-gated), which writes rows with a `status` column (`'draft' | 'review' | 'approved' | 'published' | 'rejected'` — see `supabase/migrations/20260711_final_multiplayer.sql`).
- **`status = 'published'` here has a REAL, direct gameplay effect**: `loadQuestionsForLevel()` filters `.eq("status", "published")` — only published rows are ever served to a player. This is the one place in the app where "publish" actually controls what ships to players today.
- **Review UI** (fixed in Mission 7, Parts 1/5): the AI Factory used to write straight to `status: "published"` with zero human review — a direct violation of CLAUDE.md's non-negotiable rule 6 ("Do not publish AI-generated Bible content automatically"), found during this mission's release audit. It now writes `status: "draft"`, and the AI Question Factory tab shows a "Pending AI Review" list (`/api/admin/factory-review`) where an admin explicitly approves (-> published) or rejects each generated question before it can reach a player.

### 3. Canonical question store — `lib/questions/store.ts` + `lib/questions/expansion/level*.ts` (Mission 5C/5D)

- **NOT consumed by any gameplay mode.** Verified: neither `loadQuestionsForGame.ts`, `loadQuestions.ts`, nor `friendsBattle/localQuestions.ts` import from `lib/questions/store.ts`. This was a deliberate Mission 5C scope decision (the user chose "design it, don't wire it yet" when asked directly) and remains true after this mission — Mission 7's own instructions said not to modify gameplay selection until publishing behavior is fully tested, so this mission does not change that.
- **What it's for today**: a richer, multilingual-by-design content model (permanent `questionId` shared across languages, `testament`/`canonicalCategory`/`tags`/`verified`/`translationStatus` metadata) intended to eventually replace stores #1 and #2, plus the admin review/curation workflow this mission extended.
- **Review workflow** (this mission, Part 7): `question_review_overlay.status` now supports `draft -> needs-review -> approved -> published -> rejected -> archived`, enforced server-side (`/api/admin/questions/[id]/review`: publishing requires the question to already be `approved`; only an explicit admin action can set it, never automatic). **"Published" here is currently a curation/workflow marker only — it has zero effect on what any player sees**, because nothing reads this store at runtime yet.

## Why this matters

If you mark a canonical question "Published" in the admin dashboard expecting it to appear in Friends Battle or Live Battle, **it will not** — that's store #3, and no gameplay mode reads it. Don't confuse this with the Supabase `questions.status` column (store #2), which is the one that actually gates solo play / Live Battle content today.

## Recommended path to a single source of truth

Not done in this mission (would be "redesigning the canonical question system," explicitly out of scope) — recorded here as the plan:

1. Build a sync step that imports approved+published canonical-store questions (#3) into the Supabase `questions`/`question_translations` tables (#2) with `status = 'published'`, keyed by the canonical `questionId` so multiplayer's "same ID across languages" guarantee (CLAUDE.md rule 4) is preserved.
2. Once that sync is trusted, point Friends Battle's `localQuestions.ts` at a build-time export of the canonical store instead of the legacy arrays, retiring store #1.
3. Only after both of the above are verified in production, retire manual AI-Factory-direct-to-Supabase writes in favor of "canonical store is the only place content is authored."

## Never-auto-publish guarantee

Every path that adds new questions defaults them to unpublished/unverified, never skips review:

- AI Question Factory (`/api/questions/generate` -> `lib/question-factory/database.ts`): writes `status: "draft"` (fixed this mission — see above). Requires an explicit Approve action in the dashboard's "Pending AI Review" list to become `published`.
- Canonical-store import (`/api/admin/import`): forces `verified: false`, `status: "draft"` regardless of what the imported JSON claims (Mission 5E Part 12).
- Canonical-store review (`/api/admin/questions/[id]/review`): publishing requires the prior state to already be `approved` — you cannot jump straight to published, and nothing does this automatically.

## Known gaps (honest, not fixed this mission)

- Stores #1 and #3 have zero translation-completeness enforcement against each other — a canonical question can be "published" (workflow-wise) with an incomplete `am` translation, since publishing doesn't check translation completeness.
- The new "Pending AI Review" list (store #2) has no reviewer-name/audit-trail history the way the canonical store's review overlay does (store #3) — it records who published/rejected nothing beyond the Supabase row's `updated_at`. Acceptable for this mission's fix (closing the auto-publish gap); a fuller audit trail would need its own table, same shape as `question_review_history`.
