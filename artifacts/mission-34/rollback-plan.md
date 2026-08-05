# Version 1.0 Rollback Plan

## Before deployment

1. Review the exact safe-file list in the release-candidate report and `git diff`.
2. Keep signing files and secret environments outside Git.
3. Record the deployed Vercel commit and current store-track version before promotion.

## Web rollback

1. If smoke checks fail, use the hosting provider to promote the immediately previous known-good deployment; do not rewrite Git history.
2. Verify Home, Solo entry, Friends Battle, Live Battle setup, Leaderboard, Support, legal pages, and App Links.
3. If only Church is affected, keep the previous deployment live and do not advertise/submit v1.0 until the required Church route passes.

## Android rollback

- Do not upload the AAB until web smoke gates pass.
- If an internal-track release is bad, halt promotion and upload a corrected bundle with an incremented `versionCode`; Android version codes cannot be reused.
- Never regenerate or replace the release keystore. Preserve signing lineage.

## iOS rollback

- Keep the build in internal TestFlight until archive, AASA, and device tests pass.
- Expire a bad TestFlight build and upload a corrected build with an incremented build number.
- Do not invent or change the Team ID.

## Data safety

This RC contains no schema migration. Do not weaken RLS or use a browser service-role key. Clean test Live Battle rooms/users using the established administrative cleanup path after lifecycle QA.
