-- Smoking Tracker — Supabase schema + Row-Level Security.
-- Run this once in the Supabase SQL editor.
--
-- Each user can read/write ONLY their own rows. Documents are stored as JSONB
-- so the client schema can evolve without migrations. Sync is last-write-wins
-- by updated_at (epoch milliseconds).

-- One row per cigarette.
create table if not exists public.cigarettes (
  id         text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at bigint not null default 0,
  deleted    boolean not null default false
);
create index if not exists cigarettes_user_idx on public.cigarettes (user_id);

-- One settings document per user.
create table if not exists public.settings (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at bigint not null default 0
);

-- ---- Row-Level Security ----
alter table public.cigarettes enable row level security;
alter table public.settings   enable row level security;

drop policy if exists "own cigarettes" on public.cigarettes;
create policy "own cigarettes" on public.cigarettes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own settings" on public.settings;
create policy "own settings" on public.settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---- Realtime ----
alter publication supabase_realtime add table public.cigarettes;
alter publication supabase_realtime add table public.settings;
