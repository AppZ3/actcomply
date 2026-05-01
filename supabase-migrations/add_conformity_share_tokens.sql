-- Conformity pack share tokens
-- Allows users to generate a shareable link to their conformity pack
-- without requiring the viewer to have an ActComply account.

create table if not exists conformity_share_tokens (
  id          uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  token       text not null unique default encode(gen_random_bytes(24), 'base64url'),
  label       text,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists conformity_share_tokens_token_idx on conformity_share_tokens(token);
create index if not exists conformity_share_tokens_assessment_idx on conformity_share_tokens(assessment_id);

-- RLS: users can only manage their own tokens
alter table conformity_share_tokens enable row level security;

create policy "Users manage own share tokens"
  on conformity_share_tokens
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Service role can read any token (for public share page lookup)
create policy "Service role reads all tokens"
  on conformity_share_tokens
  for select
  using (true);
