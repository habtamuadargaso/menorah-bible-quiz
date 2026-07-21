# Mission 4 — Fix Phase Changelog

Applies only the confirmed findings from `MISSION-4-AUDIT.md`. No redesign,
no architecture change, no new features, no UI layout change, no scoring
rule change, no host transfer, and Mission 3
(`lib/questions/index.ts`, `lib/questions/loadQuestionsForGame.ts`) was not
touched.

## Modified / new files

- `supabase/migrations/20260722_mission4_fixes.sql` — **new** migration
  (the three existing migrations were left untouched, exactly as
  instructed for a frozen/applied schema).
- `lib/liveBattleRoom.ts` — modified.
- `app/multiplayer/host/[code]/page.tsx` — modified.
- `app/multiplayer/play/[code]/page.tsx` — modified.
- `components/multiplayer/player/PlayerQuestion.tsx` — modified.

---

## Exact fixes

### 1. Room capacity race condition (BUG-1)
**New:** `public.join_room(p_room_code, p_display_name)` in the new
migration — a `SECURITY DEFINER` RPC that locks the room row
(`for update`) before checking `count(room_players) >= max_players` and
inserting, so the check and the join happen inside one atomic,
serialized transaction instead of the old separate
`select count(*)` → `upsert` (which could let two joiners both read
"one slot left" and both get in).
**`lib/liveBattleRoom.ts`** — `joinBattleRoom()` now calls this RPC
instead of doing the count+upsert itself, and translates the RPC's error
message back into the same `RoomError` codes (`ROOM_NOT_FOUND`,
`ROOM_STARTED`, `ROOM_FULL`) the UI already handles — no error-handling
behavior changed from the caller's point of view.

### 2. Duplicate answer submission race (BUG-2)
**`submit_answer`** (new migration, replacing the function body) now does
an `insert ... on conflict (room_question_id, player_id) do nothing`
first, and only falls back to a `select` of the existing row (returning
`already_submitted: true`) if the insert didn't happen — instead of the
old `select` (to check existence) *then* `insert`, which had a window
where two truly concurrent calls could both pass the "not found" check.

### 3. Duplicate player-name handling (BUG-3)
Folded into the same `join_room()` RPC: before inserting, it checks
whether any *other* player already in the room has the same
`display_name` and, if so, appends `" (2)"`, `" (3)"`, etc. until the
name is unique within that room. A reconnecting player's own existing
name is never touched (the check excludes their own row).

### 4. Disable answer buttons immediately when timer reaches zero (BUG-4)
**`components/multiplayer/player/PlayerQuestion.tsx`** — added a small
`timeExpired` state derived from the same `questionEndsAt` prop the
shared timer already uses, set via a `setTimeout` scheduled for exactly
when the deadline passes. `PlayerAnswerButton`'s `isLocked` prop is now
`hasSubmitted || timeExpired` instead of just `hasSubmitted`. The server
already rejected late submissions (`submit_answer`'s existing deadline
check, unchanged) — this closes the client-side gap where the button
itself wasn't disabled yet.

### 5. Reset `is_ready` correctly when replaying (BUG-5)
**`advance_phase`**'s `'waiting'` branch (new migration, replacing the
function body) now also sets `is_ready = true` in the same
`update room_players set score = 0, current_streak = 0, ...` statement
that already ran on restart — previously only `score`/`current_streak`
were reset, so a player who had toggled themselves not-ready before the
previous game ended stayed stuck not-ready after "New Battle."

### 6. Remove host DELETE permission on `answers` (FINDING-1 / FINDING-2)
New migration: `revoke delete on public.answers from authenticated;`,
plus dropping the two RLS policies this makes permanently unreachable
(`"Hosts clear room answers"`, and the already-dead-since-the-previous-
migration `"Hosts score answers"`). The one place answers are legitimately
cleared — `advance_phase(..., 'waiting')`'s restart — is a
`SECURITY DEFINER` function that runs as its owner and is completely
unaffected by this revoke, so the restart/"New Battle" flow keeps working
exactly as before. What's removed is only the host's ability to directly
delete an individual answer row (e.g. an opponent's already-submitted
correct answer) via a raw client call outside that controlled flow.

### 7. Resolve the host-disconnect freeze (RISK-2)
Uses the exact same pattern the app already has for the question phase
(`resolve_round_if_expired`, callable by any room member once a deadline
passes), extended to the three remaining host-only transitions:
- New nullable column `rooms.phase_ends_at` (new migration) — the
  deadline for the *current* countdown/reveal/leaderboard phase, entirely
  separate from the existing question-specific
  `question_started_at`/`question_ends_at`, which are untouched and still
  scoped only to the "question" phase.
- `start_battle`, `_resolve_round_internal`, and `advance_phase` (all
  re-created in the new migration with this one addition each, otherwise
  byte-for-byte the same logic as `20260719_online_live_battle.sql`) now
  set `phase_ends_at` on every transition into countdown/reveal/
  leaderboard, using the exact `COUNTDOWN_SECONDS` (3s) / `REVEAL_SECONDS`
  (5s) / `LEADERBOARD_SECONDS` (4s) values already defined — and
  previously unused — in `lib/liveBattleRoom.ts`, and clear it on the way
  out (into "question", "finished", or "waiting").
- New `advance_phase_if_expired(p_room_id)` RPC — callable by any room
  member, a server-verified no-op unless `phase_ends_at` has genuinely
  passed, otherwise performs the same transition the host's own Continue
  click would have (countdown→question, reveal→leaderboard,
  leaderboard→countdown-or-finished).
- `lib/liveBattleRoom.ts` — new `advancePhaseIfExpired(roomId)` wrapper,
  plus `phaseEndsAt` added to `RoomState`/`mapRoom`/the rooms SELECT
  column list.
- Both `app/multiplayer/host/[code]/page.tsx` and
  `app/multiplayer/play/[code]/page.tsx` — the realtime `rooms` update
  handler now also propagates `phase_ends_at` into local state, and a new
  effect (mirroring the existing `resolveRoundIfExpired` effect for the
  question phase) schedules `advancePhaseIfExpired` once the client's own
  copy of `phaseEndsAt` passes. Every connected client (host and every
  player) runs this independently, so the room can no longer freeze
  forever waiting on a host who has disconnected during countdown, reveal,
  or leaderboard — without any host-transfer mechanism, new scheduler, or
  Edge Function.

No changes were made to `Countdown.tsx`, `HostRoundReveal.tsx`,
`HostLeaderboard.tsx`, or any host-facing "Continue" button — the host's
manual, immediate advance still works exactly as before; the fix only adds
a backstop for when nobody clicks it.

---

## Verification performed

- **`pnpm build`**: succeeded — `✓ Compiled successfully`, all 12 routes
  generated, zero TypeScript errors.
- **`eslint .`** (full project): zero warnings, zero errors.
- **RLS/RPC correctness — verified against a real local PostgreSQL 16
  instance** (not just read by inspection), using the same
  `auth.uid()`/`authenticated`-role test harness established earlier in
  this project's history. All three existing migrations plus this new one
  were applied in order with `ON_ERROR_STOP=1` and all four applied
  cleanly. Targeted SQL tests confirmed:
  - **Fix 1**: a 3rd join to a 2-player-max room is rejected
    (`"This room is full."`), while an *existing* member can still
    "rejoin" a room that's at/over capacity (no false lockout).
  - **Fix 2**: calling `submit_answer` twice for the same player+question
    returns `already_submitted: true` on the second call (with the
    original stored `is_correct`, not recomputed) instead of erroring, and
    exactly one row exists in `answers` afterward.
  - **Fix 3**: two different players both joining as "Alice" end up
    stored as `"Alice"` and `"Alice (2)"`.
  - **Fix 5**: after `advance_phase(..., 'waiting')`, every player's row
    shows `is_ready = true`, including one explicitly set to `false`
    immediately beforehand.
  - **Fix 6**: a direct `delete from answers` executed as the
    `authenticated` role fails with `permission denied for table answers`;
    the row is confirmed still present afterward.
  - **Fix 7**: a room started into `countdown` with `phase_ends_at` set;
    a non-host player calling `advance_phase_if_expired` *before* the
    deadline is a no-op (room stays in `countdown`); after forcing the
    deadline into the past (simulating an unresponsive host), a
    **different non-host player** successfully advances the room from
    `countdown` to `question` (current question incremented, question
    deadline set, phase deadline cleared).
  - **Unaffected, reconfirmed still correct**: a non-host calling the
    host-only `advance_phase` directly is still rejected
    (`"Only the host can advance the room"`); `start_battle`'s "at least
    two players" and "questions are not ready yet" checks; scoring math in
    `_resolve_round_internal` (rank-based 100/75/50/25, doubled on the
    final question) is byte-for-byte unchanged.
- One real bug was caught *by this verification process itself* during
  development and fixed before finalizing: the first draft of
  `join_room()` used `INSERT ... ON CONFLICT (room_id, player_id)`, which
  Postgres rejected as an ambiguous column reference against the
  function's own `room_id` OUT parameter. Replaced with an explicit
  exists-check + insert/update — safe here specifically because the
  function already holds a `for update` lock on the room row for its
  entire duration, so no race is reintroduced.
- **Live two-browser smoke test**: not performed, for the same reason
  noted in `MISSION-4-AUDIT.md` — this sandbox has no configured Supabase
  project to create a real room against. The local-Postgres verification
  above exercises the actual, unmodified RPC/RLS code that would run in
  production, just outside of the Supabase-hosted environment itself.
