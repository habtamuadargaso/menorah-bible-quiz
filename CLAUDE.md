# Menorah Bible Quiz — Claude Code Handoff

## Mission
Build a trustworthy, multilingual Bible learning game for individuals, families, churches, and live competitions.

## Non-negotiable rules
1. Never delete working features without replacing them and documenting the change.
2. Keep `npm run build` passing before finishing any task.
3. Never expose `.env.local`, service-role keys, database passwords, or private API keys.
4. Every multiplayer player must receive the same permanent question ID. Only translated display text changes.
5. Do not silently fall back to English questions in another selected language. Show a clear unavailable-content message.
6. Do not publish AI-generated Bible content automatically. Generated content must remain draft/reviewed until human approval.
7. Preserve Row Level Security. Do not solve permissions by disabling RLS.
8. Do not use copyrighted music unless the repository contains evidence of a commercial-use license.

## Current product state
- Next.js 14, TypeScript, Tailwind, Framer Motion
- Solo campaign with 10 levels
- XP, coins, achievements, daily rewards
- English question bank: 100 questions
- Amharic native bank: 10 questions
- Other languages: UI translations/placeholders only
- Supabase anonymous auth, profiles, room creation, join-by-code, lobby
- Live battle route at `/multiplayer/battle/[code]`
- Question audit route at `/admin/questions`

## Required checks after changes
```bash
npm install
npm run build
```

## Database setup
Run `supabase/migrations/20260711_final_multiplayer.sql` in Supabase SQL Editor once.

## Environment variables
Copy `.env.example` to `.env.local` and fill only public browser-safe credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Highest-priority roadmap
1. Review and expand canonical questions to 300 unique IDs.
2. Translate the same IDs into Amharic.
3. Move canonical questions into Supabase tables with approval status.
4. Replace client-authoritative answer correctness with a server-side RPC/Edge Function.
5. Add Google sign-in and cloud progress.
6. Beta test with 20–50 church users.
