# Work Log

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
