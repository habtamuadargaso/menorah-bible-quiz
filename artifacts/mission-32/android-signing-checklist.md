# Android Signing and Google Play Checklist

## Audited configuration

- `applicationId`: `com.menorah.biblequiz`
- `namespace`: `com.menorah.biblequiz`
- `versionCode`: 1
- `versionName`: 1.0.0
- Release configuration loads `android/key.properties` only when present.
- Release tasks fail instead of falling back to debug signing.
- Expected output: `android/app/build/outputs/bundle/release/app-release.aab`.
- `android/release.keystore` and `android/key.properties` are both gitignored and currently absent.
- An ignored AAB from 2026-07-29 is present and contains a signature block, package `com.menorah.biblequiz`, and version 1.0.0. Its key provenance cannot be verified because the corresponding keystore is absent. Do not upload it; rebuild from the owner-controlled upload key.

## Owner-run upload-key creation

Run once from the repository root, as already documented by `android/key.properties.example`:

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore android/release.keystore \
  -alias menorah-release \
  -keyalg RSA -keysize 2048 -validity 10000
```

Copy `android/key.properties.example` to `android/key.properties`, replace its password placeholders locally, and store the keystore and passwords in the owner's secrets vault. Never commit either private file.

## Signed build verification

After the owner supplies both private files:

```bash
cd android
./gradlew clean bundleRelease
jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release.aab
```

Confirm `BUILD SUCCESSFUL`, a signed AAB at the expected path, no debug-signing fallback, package `com.menorah.biblequiz`, version code 1, and version name 1.0.0.

Extract the upload certificate fingerprint without exposing passwords:

```bash
keytool -list -v -keystore android/release.keystore -alias menorah-release
```

Copy only the SHA-256 certificate fingerprint into `public/.well-known/assetlinks.json`, deploy, and repeat the checks in `app-links-verification.md`.

## Google Play Console manual checklist

- [ ] Create the app with package `com.menorah.biblequiz`.
- [ ] Enable Play App Signing.
- [ ] Upload the signed AAB to Internal Testing first.
- [ ] Complete App content.
- [ ] Complete Data Safety from the approved Mission 24 source; do not infer answers from this checklist.
- [ ] Complete content rating.
- [ ] Declare the real target audience.
- [ ] Add `https://www.menorahbiblequiz.com/privacy`.
- [ ] Add a real monitored support email and `https://www.menorahbiblequiz.com/support` only after the page is functional.
- [ ] Upload the Mission 31 Google Play graphics and copy.
- [ ] Add testers and verify the installed build from the Internal Testing track.
- [ ] Do not promote to production until all Critical and High blockers are cleared.
