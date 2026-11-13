-- VoxFable Schema Migration 0001_init.sql
-- Enables UUID generation and sets up initial schema with RLS

create extension if not exists "pgcrypto";

-- Function for updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  account_type text check (account_type in ('parent', 'creator', 'school')) default 'parent',
  created_at timestamptz default now()
);

-- 2. SERIES
create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  world jsonb default '{}'::jsonb,
  tone text,
  age_band text check (age_band in ('3-5', '4-6', '6-8')),
  language text default 'en',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger tr_series_updated_at
before update on public.series
for each row execute function public.set_updated_at();

-- 3. CHARACTERS
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  series_id uuid references public.series(id) on delete set null,
  slug text,
  name text not null,
  bible jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 4. GENERATIONS
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text check (kind in ('quick', 'batch')),
  prompt text,
  series_id uuid references public.series(id) on delete set null,
  count int,
  status text check (status in ('queued', 'running', 'succeeded', 'failed')) default 'queued',
  stage text,
  progress int,
  episode_ids uuid[] default '{}',
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger tr_generations_updated_at
before update on public.generations
for each row execute function public.set_updated_at();

-- 5. EPISODES
create table if not exists public.episodes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  series_id uuid references public.series(id) on delete set null,
  generation_id uuid references public.generations(id) on delete set null,
  episode_no int,
  title text not null,
  plan jsonb default '{}'::jsonb,
  safety jsonb default '{}'::jsonb,
  continuity jsonb default '{}'::jsonb,
  audio_manifest jsonb default '{}'::jsonb,
  status text check (status in ('draft', 'ready', 'needs_review', 'failed')) default 'draft',
  video_path text,
  created_at timestamptz default now()
);

-- INDEXES
create index if not exists idx_series_owner on public.series(owner_id);
create index if not exists idx_series_owner_created on public.series(owner_id, created_at desc);

create index if not exists idx_characters_owner on public.characters(owner_id);
create index if not exists idx_characters_series on public.characters(series_id);

create index if not exists idx_generations_owner on public.generations(owner_id);
create index if not exists idx_generations_owner_created on public.generations(owner_id, created_at desc);

create index if not exists idx_episodes_owner on public.episodes(owner_id);
create index if not exists idx_episodes_owner_created on public.episodes(owner_id, created_at desc);
create index if not exists idx_episodes_series on public.episodes(series_id);

-- ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.series enable row level security;
alter table public.characters enable row level security;
alter table public.generations enable row level security;
alter table public.episodes enable row level security;

-- POLICIES
drop policy if exists "profiles_owner" on public.profiles;
create policy "profiles_owner" on public.profiles
for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "series_owner" on public.series;
create policy "series_owner" on public.series
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "characters_owner" on public.characters;
create policy "characters_owner" on public.characters
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "generations_owner" on public.generations;
create policy "generations_owner" on public.generations
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "episodes_owner" on public.episodes;
create policy "episodes_owner" on public.episodes
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- TRIGGER FUNCTION ON AUTH.USERS FOR PROFILE CREATION
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, account_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'account_type', 'parent')
  );
  return new;
end;
$$ language plpgsql security definer;

-- DROP AND RECREATE AUTH TRIGGER
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
