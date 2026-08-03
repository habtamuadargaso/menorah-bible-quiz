# App Links and Universal Links Verification

## Android App Links

- Package is correctly fixed at `com.menorah.biblequiz`.
- Local `public/.well-known/assetlinks.json`: valid JSON, but fingerprint placeholder remains.
- Live `https://www.menorahbiblequiz.com/.well-known/assetlinks.json`: HTTP 200, `application/json`, no redirect, valid JSON, correct package, but fingerprint placeholder remains.
- Status: **Critical blocker** until the owner's upload certificate SHA-256 is inserted and deployed.

After signing exists:

```bash
keytool -list -v -keystore android/release.keystore -alias menorah-release
curl -i --max-redirs 0 https://www.menorahbiblequiz.com/.well-known/assetlinks.json
```

Confirm the deployed fingerprint exactly matches the upload/release certificate used by the installed test build.

## iOS Universal Links

- Entitlement file contains `applinks:www.menorahbiblequiz.com`.
- Xcode project now references `App/App.entitlements` for Debug and Release.
- Local AASA: valid JSON, but Team ID placeholder remains.
- Live AASA: HTTP 200, `application/json`, no redirect, valid JSON, but Team ID placeholder remains.
- Status: **Critical blocker** until the real 10-character Team ID is inserted and deployed.

After the owner retrieves the Team ID, expected `appID` format is:

```text
TEAMID.com.menorah.biblequiz
```

Then verify on a signed device build that supported `/join/*` and `/multiplayer/join*` URLs open in the app and unsupported paths remain on the web.
