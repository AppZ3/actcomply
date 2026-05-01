-- Article 12 logging spec + Article 19 retention schedules
-- Run this in Supabase SQL editor: Dashboard → SQL Editor → New query

create table if not exists logging_specs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  assessment_id uuid references assessments(id) on delete cascade not null,
  content jsonb not null,
  generated_at timestamptz not null default now(),
  unique (user_id, assessment_id)
);

alter table logging_specs enable row level security;

create policy "Users can manage their own logging specs"
  on logging_specs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
