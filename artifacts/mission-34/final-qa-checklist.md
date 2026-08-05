# Final QA Checklist

## Automated validation

- [x] `npm run lint` — pass, no warnings/errors
- [x] `npm test` — 7 files, 59 tests passed
- [x] `npm run build` — pass, 21 static pages generated; `/church` included
- [x] Existing browser regression — 19/19 passed
- [x] `npx cap sync` — Android, iOS, and web sync passed; 5 plugins detected on each native platform
- [x] `git diff --check` — pass

## Feature freeze

- [x] Onboarding renders and persists (regression evidence)
- [x] Premium Home loads
- [x] Daily Challenge remains hidden through `SHOW_DAILY_CHALLENGE = false`
- [x] Church Mode is visible in the source RC
- [x] No visible “Coming Soon” discovery surfaces in the source RC
- [x] Friends Battle setup, match start, two rounds, scoring, and settings persistence pass the existing regression suite
- [x] Church English: 2 players, 5 questions, correct/wrong reveal, ranking, champion
- [x] Church Amharic: 8 players, 10 questions, ranking, champion
- [x] Church participant maximum remains 8
- [x] Church is local shared-screen and awards no profile rewards/Supabase writes by design and implementation review
- [x] Leaderboard renders signed out without 42501, console errors, or mock banner
- [ ] Fresh complete Solo correct/wrong/timeout/results/XP persistence journey — prior evidence exists, not completely rerun in Mission 34
- [ ] Fresh Friends Battle full ten-question champion/play-again path — core regression passed; full path not rerun
- [ ] Live Battle two-session synchronized lifecycle and cleanup — not completed

## Responsive and accessibility

Playwright checked `/`, `/learn`, `/leaderboard`, `/profile`, `/settings`, `/friends-battle`, `/multiplayer`, `/church`, `/privacy`, `/terms`, and `/support` at 375, 390, 430, 768, 1024, and 1440 pixels against the local production build.

- [x] Every route returned 200
- [x] No horizontal overflow
- [x] No hydration warnings
- [x] No console or page errors
- [x] No failed first-party assets
- [x] No mock-data banners or placeholder/Coming Soon text
- [x] Automated visible-control measurement found no target below 44×44 after repairs
- [x] Keyboard-focus styles and semantic controls present by code audit
- [x] Reduced-motion paths present in primary animated components
- [ ] Physical VoiceOver/TalkBack, haptics, keyboard overlap, and contrast verification — owner/device testing required

## Release regression

- [x] 19/19 repository browser regression checks
- [x] 10/10 Church engine unit tests
- [x] 9/9 deep-link tests
- [x] 24/24 translation workflow/gating tests
- [x] 24/24 Live Battle question selection/language tests
