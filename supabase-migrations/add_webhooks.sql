-- May 2026 — outbound webhook subscriptions for /api/v1/* events.
-- Lets integrators receive HTTP POSTs when events happen on their account
-- (e.g. assessment.created, document.generated, alert.published).
--
-- Idempotent. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Endpoints — what URL gets pinged for which events
-- ---------------------------------------------------------------------------
create table if not exists webhook_endpoints (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  org_id          uuid references organizations(id) on delete cascade,
  url             text not null,
  description     text default '',
  secret          text not null, -- HMAC-SHA256 signing secret (32-byte hex)
  enabled_events  text[] not null default array[]::text[],
  status          text not null default 'enabled' check (status in ('enabled', 'disabled')),
  created_at      timestamptz not null default now(),
  last_used_at    timestamptz
);

create index if not exists webhook_endpoints_user_idx on webhook_endpoints(user_id);
create index if not exists webhook_endpoints_org_idx  on webhook_endpoints(org_id) where org_id is not null;

alter table webhook_endpoints enable row level security;

drop policy if exists "Webhook endpoint access" on webhook_endpoints;
create policy "Webhook endpoint access" on webhook_endpoints
  for all
  using (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  )
  with check (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  );

-- ---------------------------------------------------------------------------
-- 2. Deliveries — audit trail of every dispatched HTTP attempt
-- ---------------------------------------------------------------------------
create table if not exists webhook_deliveries (
  id                uuid primary key default gen_random_uuid(),
  endpoint_id       uuid not null references webhook_endpoints(id) on delete cascade,
  event_type        text not null,
  event_id          uuid not null default gen_random_uuid(),
  payload           jsonb not null,
  response_status   int,
  response_body     text,
  attempts          int not null default 0,
  status            text not null default 'pending' check (status in ('pending', 'delivered', 'failed', 'abandoned')),
  next_retry_at     timestamptz,
  created_at        timestamptz not null default now(),
  delivered_at      timestamptz
);

create index if not exists webhook_deliveries_endpoint_idx on webhook_deliveries(endpoint_id);
create index if not exists webhook_deliveries_status_idx   on webhook_deliveries(status) where status in ('pending', 'failed');
create index if not exists webhook_deliveries_created_idx  on webhook_deliveries(created_at desc);

alter table webhook_deliveries enable row level security;

drop policy if exists "Webhook delivery access" on webhook_deliveries;
create policy "Webhook delivery access" on webhook_deliveries
  for select
  using (
    exists (
      select 1 from webhook_endpoints e
      where e.id = webhook_deliveries.endpoint_id
        and (
          (e.org_id is null and e.user_id = auth.uid())
          or (e.org_id is not null and has_org_access(e.org_id))
        )
    )
  );
