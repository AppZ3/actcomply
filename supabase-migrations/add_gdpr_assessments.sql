-- GDPR DPIA + EU AI Act FRIA (Article 27) integrated assessments
-- Run this in Supabase SQL editor: Dashboard → SQL Editor → New query

create table if not exists gdpr_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  assessment_id uuid references assessments(id) on delete cascade not null,
  content jsonb not null,
  generated_at timestamptz not null default now(),
  unique (user_id, assessment_id)
);

alter table gdpr_assessments enable row level security;

create policy "Users can manage their own gdpr assessments"
  on gdpr_assessments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
