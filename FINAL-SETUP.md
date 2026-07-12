# Menorah Bible Quiz — Final Setup

## 1. Install and configure

```bash
npm install
cp .env.example .env.local
```

Add your Supabase Project URL and Publishable Key to `.env.local`.
Never add the service-role key to the browser application.

## 2. Prepare Supabase

1. Enable **Anonymous Sign-ins** in Authentication → Sign In / Providers.
2. Open SQL Editor.
3. Run the complete migration:

```text
supabase/migrations/20260711_final_multiplayer.sql
```

The migration is idempotent and may be safely rerun after future updates.

## 3. Start and validate

```bash
npm run dev
```

Test these flows:

- `/` — English and Amharic solo campaign
- `/multiplayer` — create a room
- Incognito/second browser — join the room code
- Host — start a ten-question live battle
- Both devices — submit answers and verify the synchronized scoreboard

## 4. Production validation

```bash
npm run lint
npm run build
```

## Product scope in this release

- English: ten complete campaign levels (100 native questions)
- Amharic: one complete native level (10 native questions)
- Other language UI files remain in the repository for future translation work, but are intentionally hidden from the player language selector until their reviewed question banks are ready.
- The game never labels one translated question as a complete ten-question category.
