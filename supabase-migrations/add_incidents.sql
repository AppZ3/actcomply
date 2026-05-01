-- Article 72/73 incident log
-- severity:
--   immediate_risk → 24-hour reporting deadline (Article 73 — immediate health/safety risk)
--   serious        → 15-day reporting deadline  (Article 73 — serious incident)
--   malfunction    → 3-month logging obligation  (Article 72 — post-market monitoring)
--   near_miss      → no reporting required, log for post-market monitoring only

create table if not exists incidents (
  id                uuid primary key default gen_random_uuid(),
  assessment_id     uuid not null references assessments(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  title             text not null,
  description       text not null,
  severity          text not null check (severity in ('immediate_risk', 'serious', 'malfunction', 'near_miss')),
  discovery_date    date not null,
  reporting_deadline date,
  status            text not null default 'discovered'
                      check (status in ('discovered', 'under_review', 'reported', 'resolved')),
  authority_name    text,
  report_reference  text,
  reported_at       timestamptz,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists incidents_assessment_idx on incidents(assessment_id);
create index if not exists incidents_user_idx on incidents(user_id);

alter table incidents enable row level security;

create policy "Users manage own incidents"
  on incidents for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
