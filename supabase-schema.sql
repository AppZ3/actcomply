-- ActComply — Supabase Schema
-- Run this in your Supabase project SQL Editor

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  plan text not null default 'free',            -- 'free' | 'starter' | 'business' | 'enterprise'
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text,                     -- 'active' | 'past_due' | 'canceled'
  systems_limit integer not null default 1,     -- -1 = unlimited
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- ============================================================
-- ASSESSMENTS
-- ============================================================
create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,

  -- Input
  name text not null,
  description text not null,
  purpose text not null,
  sector text not null,
  uses_personal_data boolean not null default false,
  makes_autonomous_decisions boolean not null default false,
  affects_individuals boolean not null default false,
  current_safeguards text,

  -- Output
  risk_level text not null,                     -- 'PROHIBITED' | 'HIGH_RISK' | 'LIMITED_RISK' | 'MINIMAL_RISK'
  compliance_score integer not null,
  risk_rationale text not null,
  regulatory_basis text not null,
  requirements jsonb not null default '[]',
  prohibited_reason text,
  immediate_actions jsonb not null default '[]',
  estimated_effort text not null,

  created_at timestamptz not null default now()
);

alter table assessments enable row level security;

create policy "Users can view own assessments"
  on assessments for select
  using (auth.uid() = user_id);

create policy "Users can insert own assessments"
  on assessments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own assessments"
  on assessments for delete
  using (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure set_updated_at();
