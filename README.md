# Menorah Bible Quiz

A multilingual Bible-learning game with solo campaign progression, rewards, local battle mode, and Supabase-powered online rooms and live battles.

## Current release

- Next.js 14 + TypeScript + Tailwind CSS + Framer Motion
- 10-level solo campaign with different questions across levels
- XP, coins, achievements, daily rewards, leaderboard, music and sound controls
- English gameplay bank: 100 reviewed candidate questions
- Amharic gameplay bank: 10 native questions
- Additional language UI scaffolding with explicit content-availability messaging
- Supabase anonymous authentication and player profiles
- Create room, join by code, waiting lobby, and synchronized live battle route
- PWA manifest and installable app metadata
- Development question-bank audit at `/admin/questions`

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill `.env.local` with your existing Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Open `http://localhost:3000`.

## Supabase setup

Run this once in **Supabase → SQL Editor**:

```text
supabase/migrations/20260711_final_multiplayer.sql
```

This adds live-battle fields, question/answer tables, RLS policies, and Realtime publication entries.

## Important routes

- `/` — main game
- `/multiplayer` — create or join an online room
- `/multiplayer/lobby/[code]` — waiting lobby
- `/multiplayer/battle/[code]` — live synchronized battle
- `/admin/questions` — development content audit
- `/guest-test` — development-only guest/profile test

## Production safety notes

- Never commit `.env.local`.
- Keep RLS enabled.
- The current battle is a strong beta implementation, but competitive public tournaments should move answer validation and ranking to a server-side Supabase RPC or Edge Function before prizes or paid competition.
- Bible questions, references, explanations, and translations require human review before public publication.
- Use the included music only when you own it or have a commercial-use license.

## Quality check

```bash
npm run build
```

## Recommended next release

1. Expand to 300 canonical question IDs.
2. Add matching English and Amharic translations for every ID.
3. Store approved questions in Supabase.
4. Add server-authoritative scoring.
5. Run a church beta before public app-store release.
