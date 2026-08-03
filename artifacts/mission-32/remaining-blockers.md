# Remaining Release Blockers

## Critical

- Owner must create and securely retain the Android upload keystore and key properties.
- Rebuild and verify a signed release AAB from the owner-controlled key; do not use the stale artifact of unverified provenance.
- Replace/deploy the Android SHA-256 placeholder.
- Owner must select the paid Apple Developer Team and record the real Team ID.
- Replace/deploy the Apple Team ID placeholder.
- Produce and verify the first iOS Archive before TestFlight.
- Fix and retest the production `get_leaderboard` permission failure (`42501`).

## High

- Verify all required Vercel Production variables by name/presence.
- Retrieve and compare the production Supabase migration ledger.
- Verify anonymous auth, RLS, Live Battle lifecycle, admin mapping/login, and no mock data using controlled production testing.
- Configure a real monitored support email or form and update `/support` without inventing contact details.
- Locate/approve the Mission 24 Data Safety source of truth before answering Play/App Store privacy questionnaires.
- Redeploy metadata fixes and verify canonical, `og:url`, and Open Graph image use the production domain.

## Medium

- Complete iPhone/iPad simulator or device smoke tests for every required route and flow.
- Review Xcode archive privacy warnings and generated privacy report.
- Verify `PrivacyInfo.xcprivacy` and Associated Domains entitlement inside the archive.
- Complete Google Play content rating/target-audience forms and App Store Connect metadata review.

## Cleared only after evidence

Do not reinterpret an unverified item as passing. Move an item to Cleared only after recording the console/build/device evidence in the production-readiness report. Do not submit publicly as part of Mission 32.
