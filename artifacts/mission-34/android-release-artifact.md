# Android Release Artifact

Status: **verified signed release bundle**

- Application ID: `com.menorah.biblequiz`
- Version code: `1`
- Version name: `1.0.0`
- Build command: `cd android && ./gradlew clean bundleRelease`
- Result: `BUILD SUCCESSFUL`; `signReleaseBundle` executed
- Artifact: `android/app/build/outputs/bundle/release/app-release.aab`
- Size: 3,192,355 bytes
- SHA-256 checksum: `c1d2c19fdfd7918bac9da01667e24d0f8673638089791e188c047e3640cb1b76`
- Signing certificate SHA-256: `36:2F:B7:DA:E9:5A:E0:54:0B:D0:CF:88:A3:8B:9E:1F:E0:EA:7E:5B:17:BA:11:B8:60:0D:73:78:B0:64:44:E1`
- Certificate expiry: 2053-12-19 09:59 PST
- `jarsigner -verify`: `jar verified`

The verification tool also reports expected self-signed/no-timestamp warnings and the standard warning that AAB validation should use `jarsigner`; these do not indicate a failed signature. Gradle reports deprecated-feature and `flatDir` warnings, classified Low.

`android/app/release.keystore` and `android/key.properties` exist locally and remain ignored. Release configuration has no debug-signing fallback and fails release tasks if signing properties are absent.
