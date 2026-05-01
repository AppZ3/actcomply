-- Article 9 risk management plans
-- Run this in Supabase SQL editor: Dashboard → SQL Editor → New query

create table if not exists risk_management_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  assessment_id uuid references assessments(id) on delete cascade not null,
  content jsonb not null,
  generated_at timestamptz not null default now(),
  unique (user_id, assessment_id)
);

alter table risk_management_plans enable row level security;

create policy "Users can manage their own risk management plans"
  on risk_management_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
