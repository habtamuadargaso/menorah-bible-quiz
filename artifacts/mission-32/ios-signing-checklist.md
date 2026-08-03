# iOS Signing, Privacy, Archive, and TestFlight Checklist

## Repository state

- Workspace: `ios/App/App.xcworkspace`
- Bundle ID: `com.menorah.biblequiz`
- Marketing version: 1.0.0
- Build number: 1
- Automatic signing is configured, but no Team ID is present.
- `App.entitlements` is now referenced through `CODE_SIGN_ENTITLEMENTS` for Debug and Release.
- Associated domain: `applinks:www.menorahbiblequiz.com`
- `PrivacyInfo.xcprivacy` is now included in Copy Bundle Resources.
- Capacitor iOS and CapacitorCordova dependencies resolve their own privacy manifests.

## Owner signing steps

1. Open `ios/App/App.xcworkspace` in Xcode.
2. Select the App target and Signing & Capabilities.
3. Select the paid Apple Developer Team.
4. Confirm bundle ID `com.menorah.biblequiz`.
5. Keep Automatically manage signing enabled unless a verified manual-signing need exists.
6. Confirm Xcode creates a valid distribution provisioning profile.
7. Record the real 10-character Team ID in the owner's release records.
8. Replace only the Team ID placeholder in `public/.well-known/apple-app-site-association`, deploy, and verify it.

Do not commit certificates, provisioning profiles, App Store Connect credentials, or secret exports.

## Capability and privacy checks in Xcode

- [ ] Associated Domains capability is visible on the App target.
- [ ] `applinks:www.menorahbiblequiz.com` appears exactly once.
- [ ] `App.entitlements` has App target membership.
- [ ] `PrivacyInfo.xcprivacy` has App target membership.
- [ ] `PrivacyInfo.xcprivacy` appears in Copy Bundle Resources.
- [ ] Xcode privacy report matches actual web/native data behavior.
- [ ] Any dependency privacy warnings are reviewed honestly; do not fabricate required-reason declarations.

## First archive

```bash
npx cap sync ios
open ios/App/App.xcworkspace
```

Select Any iOS Device/Generic iOS Device, then Product → Archive. Verify the archive has no signing, icon, or privacy-manifest errors; has version 1.0.0/build 1 and bundle ID `com.menorah.biblequiz`; and loads the production domain. Inspect the archive to confirm both the entitlement and `PrivacyInfo.xcprivacy` are bundled.

Upload to App Store Connect/TestFlight only after the archive passes. Do not submit publicly.

## Automated evidence

An unsigned Release simulator build succeeded on 2026-08-02. The built App bundle contains `PrivacyInfo.xcprivacy`, and the embedded Capacitor and Cordova frameworks contain their dependency manifests. This validates resource wiring but is not a distribution archive and does not validate signing or TestFlight acceptance.
