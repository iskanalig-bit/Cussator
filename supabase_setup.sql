-- Cussator: optional Google sign-in, per-user progress sync.
-- Run in the Supabase SQL Editor. Safe to re-run.

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  bag jsonb not null default '{}'::jsonb,
  scars jsonb not null default '{}'::jsonb,
  connector_log jsonb not null default '{}'::jsonb,
  bag_word_info jsonb not null default '{}'::jsonb,
  round_history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

drop policy if exists "read own progress" on public.user_progress;
create policy "read own progress" on public.user_progress
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "insert own progress" on public.user_progress;
create policy "insert own progress" on public.user_progress
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "update own progress" on public.user_progress;
create policy "update own progress" on public.user_progress
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Signed-in users only; guests (anon) get nothing. No delete grant/policy.
revoke all on public.user_progress from anon;
grant select, insert, update on public.user_progress to authenticated;
