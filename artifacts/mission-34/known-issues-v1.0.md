# Known Issues — Version 1.0 RC

## Critical

None confirmed.

## High — resolve before public submission

### H1: Production Church route is missing

Production `/church` returns 404 while Church Mode is a required v1.0 feature. The source RC adds the route and sitemap entry. Deploy, then rerun production smoke, canonical, sitemap, and Church gameplay checks.

### H2: Complete Live Battle lifecycle is not freshly verified

Setup loads and Live Battle unit/regression coverage passes, but Mission 34 did not create production records or complete a two-session synchronized room. Verify host/join, same question, timer, first-correct and late-answer behavior, scoring, advances, results, leave, and abandoned-room cleanup; clean all test records.

### H3: Apple signing and Universal Links are incomplete

No real Development Team is configured, AASA has a Team-ID placeholder, and no Archive/TestFlight result exists. This blocks App Store submission, not Android/internal testing.

### H4: Production canonical/sitemap state is stale

Deployed public routes inherit the Home canonical and the deployed sitemap omits required pages. Correct route canonicals and sitemap entries are in source; deploy and verify.

## Medium

### M1: Full Solo journey was not freshly rerun

Prior real-flow captures and current regression/unit evidence exist, but Mission 34 did not freshly complete the exact correct/wrong/timeout/bottom-sheet/results/XP/persistence matrix.

### M2: Physical assistive-technology/device QA remains

VoiceOver, TalkBack, native haptics, keyboard overlap, adverse networks, and memory profiling require owner devices. Automated control sizing and responsive checks pass.

### M3: Tablet store screenshots remain blocked

Do not upload tablet screenshots until the documented tablet-layout blocker is resolved and new real-device captures pass review.

## Low

- Android Gradle emits `flatDir` and deprecated-feature warnings.
- The iOS App Preview package contains a storyboard but no recorded preview video.
