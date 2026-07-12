# Menorah Bible Quiz — Product Build Notes

This build is the product-ready web MVP for Menorah Bible Quiz.

## What is finished

- 10-question game rounds
- 15-second timer per question
- Auto timeout handling
- Level 1–10 campaign structure
- Pass rule: 7/10 correct unlocks the next campaign level
- Level map with locked, current, and completed states
- XP, coins, player level, daily rewards, badges, and leaderboard
- Music and sound effects using the included `/public/audio/quiz-quest.mp3`
- Language switching reloads the quiz round and question pool
- English full starter bank: 100 questions across 10 categories
- Amharic starter bank with fallback notice when English backup is used
- Other languages are ready in the architecture, but should be reviewed before full public launch
- Build verified with `NEXT_TELEMETRY_DISABLED=1 npm run build`

## Question-bank strategy

Do not hand-code 10,000 questions inside components. Add reviewed questions inside `lib/questions/` or later move them into a database/admin panel.

Recommended content growth:

1. Finish English to 1,000 verified questions.
2. Finish Amharic to 1,000 verified questions.
3. Add Oromo, Tigrinya, Spanish, French, Arabic, Swahili, and others one language at a time.
4. Later move the question bank to Supabase with an admin review workflow.

## Public launch checklist

Before launching broadly:

- Verify every Bible question and reference.
- Confirm you have permission/license for any music used publicly.
- Replace placeholder coming-soon sections when ready.
- Deploy to Vercel.
- Test on iPhone, Android, tablet, and desktop.

## Commands

```bash
npm install
npm run dev
NEXT_TELEMETRY_DISABLED=1 npm run build
```
