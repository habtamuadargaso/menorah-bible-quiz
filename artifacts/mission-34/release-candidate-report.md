# Menorah Bible Quiz 1.0.0 Release Candidate Report

Date: 2026-08-05  
Source baseline: `main` at `d12fb848e27f`  
Recommendation: **READY FOR INTERNAL TESTING**

The source release candidate builds, its signed Android bundle is valid, required local routes pass the responsive browser matrix, and the existing regression suite passes. It is not ready for public store submission: production still returns 404 for `/church`, Apple signing/AASA require the owner's real Team ID, and the complete two-session Live Battle lifecycle was not rerun during this pass.

## Safe start

- `main` matched `origin/main` (0 ahead, 0 behind) after fetch.
- Pre-existing untracked Mission 32.3 and Mission 33 artifacts were preserved.
- No keystore, `key.properties`, certificate, provisioning profile, secret environment file, password, token, or private key is tracked. The only tracked environment template is `.env.example`.
- Local Android signing files exist and are gitignored; their values were never printed or copied.

## Minimal release-blocking repairs

- Exposed the completed Church Mode engine at `/church` and enabled the existing Church v1 feature flag.
- Kept Daily Challenge hidden and hid unreleased “Coming Soon” discovery surfaces behind a v1.0 flag without deleting their implementations.
- Added missing public sitemap entries and route-specific canonical metadata.
- Raised confirmed small touch targets to 44px.
- Corrected store-review notes that still described Church Mode as unreleased.

No quiz, scoring, XP, progression, translation, multiplayer, Supabase, or database behavior was changed.

## Decision gates

| Gate | Result |
|---|---|
| Source build and tests | Pass |
| Local required-route matrix | Pass |
| Android signed AAB | Pass |
| Production required routes | Fail: `/church` is 404 until deployment |
| Production canonical URLs | Fail on current deployment; fixed in source |
| Full Live Battle two-session lifecycle | Not completed |
| iOS signing/TestFlight | Owner-account blocker |

See the companion documents for exact evidence, findings, and owner actions.
