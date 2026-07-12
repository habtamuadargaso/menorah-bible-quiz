-- Menorah Bible Quiz — complete idempotent production schema
-- Run this entire file once in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Player profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Guest Player',
  avatar text,
  language text not null default 'en',
  xp integer not null default 0 check (xp >= 0),
  coins integer not null default 0 check (coins >= 0),
  player_level integer not null default 1 check (player_level >= 1),
  campaign_level integer not null default 1 check (campaign_level between 1 and 10),
  games_played integer not null default 0 check (games_played >= 0),
  games_won integer not null default 0 check (games_won >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Reviewed Bible question library
-- ---------------------------------------------------------------------------
create table if not exists public.questions (
  id text primary key,
  level integer not null check (level between 1 and 10),
  category text not null,
  book text not null,
  chapter integer,
  difficulty text not null,
  correct_index integer not null check (correct_index between 0 and 3),
  reference text not null,
  status text not null default 'published'
    check (status in ('draft', 'review', 'approved', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_translations (
  id uuid primary key default gen_random_uuid(),
  question_id text not null references public.questions(id) on delete cascade,
  language_code text not null,
  question_text text not null,
  choice_1 text not null,
  choice_2 text not null,
  choice_3 text not null,
  choice_4 text not null,
  explanation text not null,
  reflection text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(question_id, language_code)
);

create table if not exists public.player_question_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.questions(id) on delete cascade,
  level integer not null check (level between 1 and 10),
  was_correct boolean,
  played_at timestamptz not null default now(),
  unique(player_id, question_id)
);

-- ---------------------------------------------------------------------------
-- Multiplayer rooms
-- ---------------------------------------------------------------------------
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'revealing', 'finished')),
  current_question integer not null default 0 check (current_question between 0 and 10),
  language text not null default 'en',
  category_id text not null default 'old-testament',
  game_level integer not null default 1 check (game_level between 1 and 10),
  max_players integer not null default 8 check (max_players between 2 and 100),
  question_started_at timestamptz,
  question_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  score integer not null default 0,
  is_ready boolean not null default true,
  joined_at timestamptz not null default now(),
  unique(room_id, player_id)
);

create table if not exists public.room_questions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  question_number integer not null check (question_number between 1 and 10),
  question_id text not null,
  created_at timestamptz not null default now(),
  unique(room_id, question_number)
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  room_question_id uuid not null references public.room_questions(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  selected_answer integer not null check (selected_answer between 0 and 3),
  is_correct boolean not null default false,
  response_time_ms integer not null default 0 check (response_time_ms >= 0),
  submitted_at timestamptz not null default now(),
  points_awarded integer not null default 0,
  unique(room_question_id, player_id)
);

-- ---------------------------------------------------------------------------
-- Grants and Row Level Security
-- ---------------------------------------------------------------------------
grant select, insert, update on public.profiles to authenticated;
grant select on public.questions, public.question_translations to authenticated;
grant select, insert on public.player_question_history to authenticated;
grant select, insert, update, delete on public.rooms, public.room_players, public.room_questions, public.answers to authenticated;

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.question_translations enable row level security;
alter table public.player_question_history enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.room_questions enable row level security;
alter table public.answers enable row level security;

-- Remove broad development policies from earlier prototypes.
drop policy if exists "Allow authenticated users" on public.profiles;
drop policy if exists "Allow authenticated users" on public.rooms;
drop policy if exists "Allow authenticated users" on public.room_players;
drop policy if exists "Allow authenticated users" on public.room_questions;
drop policy if exists "Allow authenticated users" on public.answers;

-- Profiles
 drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
for select to authenticated using (auth.uid() = id);
 drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile" on public.profiles
for insert to authenticated with check (auth.uid() = id);
 drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Published question content
 drop policy if exists "Players can read published questions" on public.questions;
create policy "Players can read published questions" on public.questions
for select to authenticated using (status = 'published');
 drop policy if exists "Players can read published translations" on public.question_translations;
create policy "Players can read published translations" on public.question_translations
for select to authenticated using (
  exists (
    select 1 from public.questions q
    where q.id = question_translations.question_id and q.status = 'published'
  )
);

-- Question history
 drop policy if exists "Players can read own question history" on public.player_question_history;
create policy "Players can read own question history" on public.player_question_history
for select to authenticated using (player_id = auth.uid());
 drop policy if exists "Players can add own question history" on public.player_question_history;
create policy "Players can add own question history" on public.player_question_history
for insert to authenticated with check (player_id = auth.uid());

-- Rooms
 drop policy if exists "Authenticated users can read rooms" on public.rooms;
create policy "Authenticated users can read rooms" on public.rooms
for select to authenticated using (true);
 drop policy if exists "Users can create rooms" on public.rooms;
create policy "Users can create rooms" on public.rooms
for insert to authenticated with check (host_id = auth.uid());
 drop policy if exists "Hosts can update rooms" on public.rooms;
create policy "Hosts can update rooms" on public.rooms
for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());
 drop policy if exists "Hosts can delete rooms" on public.rooms;
create policy "Hosts can delete rooms" on public.rooms
for delete to authenticated using (host_id = auth.uid());

-- Room players
 drop policy if exists "Authenticated users can view room players" on public.room_players;
create policy "Authenticated users can view room players" on public.room_players
for select to authenticated using (true);
 drop policy if exists "Users can join rooms" on public.room_players;
create policy "Users can join rooms" on public.room_players
for insert to authenticated with check (player_id = auth.uid());
 drop policy if exists "Users can update own room player" on public.room_players;
create policy "Users can update own room player" on public.room_players
for update to authenticated using (player_id = auth.uid()) with check (player_id = auth.uid());
 drop policy if exists "Hosts can update room player scores" on public.room_players;
create policy "Hosts can update room player scores" on public.room_players
for update to authenticated using (
  exists (select 1 from public.rooms r where r.id = room_players.room_id and r.host_id = auth.uid())
) with check (
  exists (select 1 from public.rooms r where r.id = room_players.room_id and r.host_id = auth.uid())
);
 drop policy if exists "Users can leave rooms" on public.room_players;
create policy "Users can leave rooms" on public.room_players
for delete to authenticated using (player_id = auth.uid());

-- Room questions
 drop policy if exists "Room members can read room questions" on public.room_questions;
create policy "Room members can read room questions" on public.room_questions
for select to authenticated using (
  exists (select 1 from public.room_players rp where rp.room_id = room_questions.room_id and rp.player_id = auth.uid())
);
 drop policy if exists "Hosts can manage room questions" on public.room_questions;
create policy "Hosts can manage room questions" on public.room_questions
for all to authenticated using (
  exists (select 1 from public.rooms r where r.id = room_questions.room_id and r.host_id = auth.uid())
) with check (
  exists (select 1 from public.rooms r where r.id = room_questions.room_id and r.host_id = auth.uid())
);

-- Answers
 drop policy if exists "Room members can read answers" on public.answers;
create policy "Room members can read answers" on public.answers
for select to authenticated using (
  exists (select 1 from public.room_players rp where rp.room_id = answers.room_id and rp.player_id = auth.uid())
);
 drop policy if exists "Players submit own answers" on public.answers;
create policy "Players submit own answers" on public.answers
for insert to authenticated with check (
  player_id = auth.uid() and
  exists (select 1 from public.room_players rp where rp.room_id = answers.room_id and rp.player_id = auth.uid())
);
 drop policy if exists "Hosts score answers" on public.answers;
create policy "Hosts score answers" on public.answers
for update to authenticated using (
  exists (select 1 from public.rooms r where r.id = answers.room_id and r.host_id = auth.uid())
) with check (
  exists (select 1 from public.rooms r where r.id = answers.room_id and r.host_id = auth.uid())
);
 drop policy if exists "Hosts clear room answers" on public.answers;
create policy "Hosts clear room answers" on public.answers
for delete to authenticated using (
  exists (select 1 from public.rooms r where r.id = answers.room_id and r.host_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- Realtime publication
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.rooms;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.room_players;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.room_questions;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.answers;
exception when duplicate_object then null; end $$;
