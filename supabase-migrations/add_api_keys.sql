-- Enterprise public API keys
-- Key values are stored as SHA-256 hashes; the raw key is shown once at creation

create table if not exists api_keys (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  key_hash    text not null unique,
  key_prefix  text not null,          -- first 8 chars of raw key for display
  last_used_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists api_keys_user_idx on api_keys(user_id);
create index if not exists api_keys_hash_idx  on api_keys(key_hash);

alter table api_keys enable row level security;

create policy "Users manage own api keys"
  on api_keys for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
