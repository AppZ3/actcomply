-- Newsletter subscribers + issues + per-recipient sends.
-- All access via service role (getSupabaseAdmin). RLS enabled with explicit
-- deny-all policies for anon/authenticated — service role bypasses RLS, so it
-- still has full access. Anyone using anon/authenticated keys is locked out.

-- ---- subscribers ----
create table if not exists newsletter_subscribers (
  id                  uuid primary key default gen_random_uuid(),
  email               text unique not null,
  status              text not null default 'active' check (status in ('active', 'unsubscribed', 'bounced', 'complained')),
  source              text default '',
  unsubscribe_token   text unique not null,
  created_at          timestamptz not null default now(),
  unsubscribed_at     timestamptz,
  confirmed_at        timestamptz
);

alter table newsletter_subscribers enable row level security;

drop policy if exists "service role only" on newsletter_subscribers;
create policy "service role only" on newsletter_subscribers
  for all
  to anon, authenticated
  using (false)
  with check (false);

create index if not exists newsletter_subscribers_status_idx on newsletter_subscribers(status);
create index if not exists newsletter_subscribers_token_idx on newsletter_subscribers(unsubscribe_token);


-- ---- issues ----
create table if not exists newsletter_issues (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  subject       text not null,
  body_md       text not null,
  body_html     text,
  sent_at       timestamptz,
  sent_count    int default 0,
  created_at    timestamptz not null default now()
);

alter table newsletter_issues enable row level security;

drop policy if exists "service role only" on newsletter_issues;
create policy "service role only" on newsletter_issues
  for all
  to anon, authenticated
  using (false)
  with check (false);

create index if not exists newsletter_issues_sent_at_idx on newsletter_issues(sent_at);


-- ---- sends (one row per (issue, subscriber)) ----
create table if not exists newsletter_sends (
  id              uuid primary key default gen_random_uuid(),
  issue_id        uuid not null references newsletter_issues(id) on delete cascade,
  subscriber_id   uuid not null references newsletter_subscribers(id) on delete cascade,
  resend_id       text,
  sent_at         timestamptz not null default now(),
  delivered_at    timestamptz,
  opened_at       timestamptz,
  clicked_at      timestamptz,
  bounced_at      timestamptz,
  complained_at   timestamptz,
  unique (issue_id, subscriber_id)
);

alter table newsletter_sends enable row level security;

drop policy if exists "service role only" on newsletter_sends;
create policy "service role only" on newsletter_sends
  for all
  to anon, authenticated
  using (false)
  with check (false);

create index if not exists newsletter_sends_issue_idx on newsletter_sends(issue_id);
create index if not exists newsletter_sends_subscriber_idx on newsletter_sends(subscriber_id);
create index if not exists newsletter_sends_resend_id_idx on newsletter_sends(resend_id);
