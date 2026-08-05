# iOS Release Status

Status: **repository ready; owner signing blocked**

- Bundle ID: `com.menorah.biblequiz`
- Marketing version: `1.0.0`
- Build number: `1`
- Signing style: Automatic
- Entitlements file is attached to Debug and Release configurations.
- Associated domain: `applinks:www.menorahbiblequiz.com`
- `PrivacyInfo.xcprivacy` is included in the Resources build phase.
- Capacitor iOS sync completed successfully.

No `DEVELOPMENT_TEAM` is configured in the project. The repository and deployed AASA file still contain `REPLACE_WITH_YOUR_APPLE_TEAM_ID`; therefore AASA verification, a signed Archive, Organizer validation, TestFlight upload, and processing verification were intentionally not attempted.

Owner actions:

1. Select the real Apple Developer Team in Xcode.
2. Replace the AASA placeholder with `<REAL_TEAM_ID>.com.menorah.biblequiz` and deploy it.
3. Verify the no-redirect HTTPS AASA endpoint.
4. Create and validate an Archive, upload to TestFlight, and record processing/device smoke results.
