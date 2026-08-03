# Mission 32 — Production Readiness Report

Audit date: 2026-08-02

## Executive status

Version 1.0 is **not ready for TestFlight or Google Play Internal Testing**. Local web validation and native synchronization can proceed, but release submission is blocked by owner-controlled signing, unresolved production deep-link identifiers, a missing support channel, unverified Vercel Production variables, and an unresolved production leaderboard permission failure.

No secrets or signing material are recorded in this report.

## Safe starting state

- Branch: `main`
- Working tree before Mission 32: clean
- `origin/main` synchronization after `git fetch origin --prune`: 0 ahead, 0 behind
- Android package/application ID: `com.menorah.biblequiz`
- iOS bundle identifier: `com.menorah.biblequiz`
- Android version: code 1, name 1.0.0
- iOS version: 1.0.0, build 1
- Capacitor production URL: `https://www.menorahbiblequiz.com`

## Repository changes made

- Production domain is now the safe metadata, robots, and sitemap fallback.
- Root canonical URL and Open Graph URL were added.
- The existing iOS Associated Domains entitlement is referenced by both App target configurations.
- The existing `PrivacyInfo.xcprivacy` is a target resource.
- The required Mission 32 evidence and owner checklists were added under this directory.

## Validation summary

No owner-signed Android bundle or iOS archive can be produced until the owner supplies signing identities.

## Release classification

### Critical

- Android upload keystore/key properties absent. A stale ignored AAB exists, but its signing-key provenance cannot be verified and it must not be uploaded.
- `assetlinks.json` contains a certificate-fingerprint placeholder locally and live.
- Apple Developer Team ID absent; AASA contains a placeholder locally and live.
- No Apple signing team/profile; no archive or TestFlight upload.
- Production leaderboard RPC returned permission error `42501` during read-only audit.

### High

- Vercel Production environment values cannot be verified from this unauthenticated session.
- `/support` explicitly says no support channel is configured.
- Production migration ledger could not be retrieved; migration parity is unverified.
- Mission 24 Data Safety report was not present under `artifacts/`; store declarations must not be guessed.

### Medium

- Native dependency privacy manifests exist for Capacitor iOS/Core, but archive-level privacy warnings remain unverified until Xcode Archive.
- Full production and physical/simulator native smoke tests remain owner/manual work.

### Cleared

- Public production home, Privacy, Terms, Support, robots, sitemap, asset links, and AASA endpoints return HTTP 200.
- Both well-known endpoints use an acceptable JSON content type and do not redirect from `www`.
- Native package/bundle identifiers and version numbers match Version 1.0 requirements.
- Real Android signing files are gitignored; no signing material is tracked.
- Capacitor release configuration points to the production HTTPS domain.

## Validation results

- `npm run lint`: passed, no warnings or errors.
- `npm test`: passed, 6 files / 49 tests.
- `npm run build`: passed, 20 static pages generated.
- `npx cap sync`: passed for Android, iOS, and web; generated native configs use the production HTTPS URL with cleartext disabled.
- Unsigned iOS Release simulator build: `BUILD SUCCEEDED`.
- Built iOS app contains the App privacy manifest plus Capacitor and Cordova dependency manifests.
- `git diff --check`: passed.
- Production browser route smoke: 10 routes returned HTTP 200; zero page errors and zero failed first-party requests. Two console errors reproduced the leaderboard HTTP 401 / PostgreSQL `42501` failure.
- Built local metadata: canonical, `og:url`, and `og:image` resolve to `https://www.menorahbiblequiz.com`; no localhost reference.
- Existing ignored AAB predates this mission. It contains a signing block and identifies `com.menorah.biblequiz` / 1.0.0, but the corresponding keystore is absent and provenance is unverified. It is not an acceptable release artifact.
- Signed Android release build: blocked pending owner keystore.
- Signed iOS archive/TestFlight upload: blocked pending owner Team/profile.
