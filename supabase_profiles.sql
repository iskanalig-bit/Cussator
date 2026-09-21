-- Cussator: public nicknames for signed-in users.
-- Run in the Supabase SQL Editor. Safe to re-run.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now(),
  constraint profiles_nickname_format check (
    char_length(nickname) between 3 and 16
    and nickname ~ '^[A-Za-z0-9_]+$'
  )
);

-- Reserved names can't be taken (case-insensitive). Added as its own
-- constraint so re-running this file also upgrades an existing table.
alter table public.profiles drop constraint if exists profiles_nickname_reserved;
alter table public.profiles add constraint profiles_nickname_reserved check (
  lower(nickname) not in ('admin', 'cussator', 'chair', 'judge')
);

-- Nicknames are unique regardless of letter case.
create unique index if not exists profiles_nickname_lower_key
  on public.profiles (lower(nickname));

alter table public.profiles enable row level security;

-- Any signed-in user can read nicknames (needed for the availability check).
drop policy if exists "profiles are readable by signed-in users" on public.profiles;
create policy "profiles are readable by signed-in users" on public.profiles
  for select to authenticated using (true);

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Signed-in users only; guests (anon) get nothing. No delete grant/policy.
revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;
