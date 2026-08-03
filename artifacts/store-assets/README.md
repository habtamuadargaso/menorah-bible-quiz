# Menorah Bible Quiz — Store Assets v1.0

English-first App Store and Google Play production package built from the current application and approved `public/branding/` assets.

## Upload-ready assets

- `apple/iphone/`: eight 1260 × 2736 portrait PNGs for Apple’s current 6.9-inch screenshot class.
- `apple/metadata/`: app name, subtitle, promotional text, description, keywords, v1.0 notes, review notes, and real URLs.
- `apple/preview/storyboard.md`: optional 30-second real-footage storyboard.
- `google-play/phone/`: eight 1080 × 1920 portrait PNGs.
- `google-play/feature-graphic/menorah-bible-quiz-feature-1024x500.png`: exact 1024 × 500, opaque PNG.
- `google-play/metadata/`: title, short/full descriptions, v1.0 notes, and real URLs.
- `source/raw-screenshots/`: uncropped real UI captures and prior real-flow QA captures used by the generator.
- `source/captions/`: caption-to-scene map.
- `source/copy/`: localization plan and accuracy/omission audit.
- `source/generate-store-assets.mjs`: deterministic phone-set and feature-graphic exporter.

## Tablet blocker

No upload-ready Apple iPad or Google Play tablet screenshots are included. Real 1032 × 1376 CSS-pixel tablet captures at 2× density showed the current desktop header crowding and clipping its right-side controls. The raw captures are retained for diagnosis. Shipping altered or masked tablet imagery would misrepresent the current app.

After the application’s tablet header is repaired and approved, recapture Home, Quiz, Results, and Multiplayer/Leaderboard at Apple’s current 13-inch accepted size and Google’s current large-screen aspect requirements.

## Reproduction

From the repository root with dependencies installed:

1. Start the application locally and capture real route/flow screens into `source/raw-screenshots/`. Hide browser chrome and use only non-sensitive demonstration names.
2. Run `node artifacts/store-assets/source/generate-store-assets.mjs`.
3. Run the validation commands documented in `source/quality-report.md`.

The final store graphics contain no localhost address or browser chrome. Localhost is used only as the private capture origin.

