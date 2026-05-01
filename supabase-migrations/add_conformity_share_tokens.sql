-- Conformity pack share tokens
-- Allows users to generate a shareable link to their conformity pack
-- without requiring the viewer to have an ActComply account.
-- Token is generated server-side (Node crypto) and inserted — no DB default needed.

create table if not exists conformity_share_tokens (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  token         text not null unique,
  label         text,
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists conformity_share_tokens_token_idx on conformity_share_tokens(token);
create index if not exists conformity_share_tokens_assessment_idx on conformity_share_tokens(assessment_id);

-- RLS: users manage only their own tokens.
-- Public share page lookups use the service-role admin client which bypasses RLS entirely.
alter table conformity_share_tokens enable row level security;

create policy "Users manage own share tokens"
  on conformity_share_tokens
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
