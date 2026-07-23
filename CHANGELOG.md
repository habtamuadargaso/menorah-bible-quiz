# Changelog — Package Contents

This package contains every file currently modified or added in the working
tree (uncommitted changes), preserving the original project folder structure.
Extract it directly into the project root and overwrite the existing files.

## Modified files

- `app/page.tsx`
- `components/QuizCard.tsx`
- `lib/questions/index.ts`
- `lib/questions/loadQuestionsForGame.ts`

## New files

- `components/BattleLauncher.tsx`
- `components/LanguageModal.tsx`

---

## What changed in each file

### `lib/questions/index.ts`
**Mission 3, Fix 1 — category-mixing bug.**
`questionsForLevel()` previously built each campaign level from the *entire*
language question bank, using `categoryId` only to vary the shuffle seed —
never to filter which questions were eligible. As a result, selecting one
category (e.g. "Old Testament") could silently serve questions belonging to
any other category. Fixed by filtering the bank to only that category's
questions (`categoryBank = bank.filter(q => q.categoryId === categoryId)`)
before doing the seeded ordering/slicing. The seed string, slicing math,
`usedFallback` computation, and shuffle-for-display logic are unchanged —
only the input pool is now correctly scoped.

### `lib/questions/loadQuestionsForGame.ts`
**Mission 3, Fix 3 — partial-round bug.**
When merging database/AI-generated questions with local fallback questions,
if the combined total came out to fewer than 10 (e.g. AI questions
insufficient and the now-correctly-filtered local bank can't fill the rest),
the function previously returned a partial round (fewer than 10 questions)
silently. It now returns an empty array in that case, enforcing the same
"complete round or nothing" rule that `questionsForLevel()` already applies
to the local bank. No new fallback system was introduced.

### `components/QuizCard.tsx`
**Mission 3, Fix 2 — infinite-loading risk.**
The question-loading effect had no timeout, so a hung network call to
Supabase could leave the player stuck on "Loading questions..." forever with
no way out. Added:
- A 15-second timeout (`QUESTION_LOAD_TIMEOUT_MS`) raced against the loader
  call via `Promise.race`, with the timer always cleared in `finally`.
- A `loadError` state, set when the load fails or times out.
- A `retryToken` state (included in the loading effect's dependency array)
  and a `handleRetryLoad()` handler that re-triggers the load.
- The existing "no questions" screen now conditionally shows a timeout
  message and a "Try Again" button (same button styling as the existing
  "Back to Categories" button) when `loadError` is true, otherwise renders
  exactly as before.

*(Also carries the earlier, separately-delivered "Solo Quiz language modal"
change: importing `LanguageModal`, a `showLanguageModal` state, and
`handlePlaySingle`/`handleLanguageContinue` wiring — unrelated to Mission 3,
already verified and included here for completeness.)*

### `app/page.tsx`
Carries two changes from earlier in this session, unrelated to Mission 3:
- Added the Solo Quiz language-selection modal: import of `LanguageModal`,
  a `showLanguageModal` state, `handlePlaySingle()` now opens the modal
  instead of scrolling directly, and a new `handleLanguageContinue()`
  proceeds to the categories section once a language is chosen.
- Restored `BattleLauncher` (import, `useRouter`, `handleBattleSetup()`,
  and the `<BattleLauncher onStart={handleBattleSetup} />` render between
  `PlayCards` and `ContinuePlaying`) at explicit request, after it had been
  intentionally removed in an earlier rename mission.

### `components/BattleLauncher.tsx` (new)
Recreated byte-for-byte from git history (the version that existed before
it was deleted in the play-mode rename commit). Renders the gold "Live
Battle" banner button that routes to `/multiplayer`.

### `components/LanguageModal.tsx` (new)
New component built to satisfy the Solo Quiz language-selection feature:
a glass/gold-styled modal (`open` / `onClose` / `onContinue` props) listing
the fully-translated playable languages, matching the existing app's visual
style (same card/button classes used elsewhere in the project).

---

## Verification performed

- `pnpm build` → compiled successfully, zero TypeScript errors, all 12
  routes generated.
- `eslint` → no warnings or errors.
- Direct-import script test of `questionsForLevel()`: all 10 categories at
  level 1 (English) now return exactly 10 questions each with **zero**
  `categoryId` mismatches (previously 100% mixed across categories).
- Replay-determinism test: the same `(lang, category, level)` call returns
  the identical 10 question IDs across repeated calls (only display order
  differs, as intended).
- Live smoke test in a real browser (dev server + Playwright): Solo Quiz →
  Old Testament correctly lands on "Old Testament · Level 1/10" showing a
  genuine Old Testament question, no crash, no console page errors, "Quit"
  and progress UI intact.
- Expected, correct side effect: since the local English/Amharic question
  banks only contain 10 questions per category (one level's worth), levels
  2–10 now correctly return 0 local questions per category instead of
  silently mixing in other categories to fake a full round — this is the
  intended behavior of the fix, not a regression.

## Final Amharic availability fix

- Updated `lib/questions/loadQuestionsForGame.ts` to guarantee that a language with ten valid native questions can still play Level 1 when its individual categories do not yet contain ten questions each.
- Complete category banks remain category-filtered.
- The fallback uses only the selected native language and never mixes English.
- Levels above 1 still require a complete question set and return the existing unavailable state when content is insufficient.
