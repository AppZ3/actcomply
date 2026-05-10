-- May 2026 — per-organisation data partitioning for Enterprise multi-entity use.
--
-- Background: the existing organizations + org_members tables (see
-- add_organizations.sql) implement team collaboration — inviting other users to
-- share access to your assessments. They do NOT partition assessment data
-- between organisations. This migration adds that layer.
--
-- Pattern:
--   - Add nullable `org_id` to every table that holds per-client data.
--   - org_id IS NULL means "personal workspace" — preserves all existing
--     records and existing solo-user behaviour.
--   - org_id IS NOT NULL means "scoped to this organisation" — visible only
--     to the org owner and active org members.
--   - Helper function has_org_access(uuid) centralises the membership check
--     so every RLS policy stays consistent.
--   - Indexes on org_id keep filtered queries cheap.
--
-- Idempotent: safe to re-run on a database that already has the columns,
-- function, indexes, or policies. RLS warnings shown by the Supabase editor
-- for the ALTER POLICY blocks are false positives — RLS is already enabled
-- on every affected table.

-- ---------------------------------------------------------------------------
-- 1. Helper function
-- ---------------------------------------------------------------------------
-- Returns true if the current authenticated user has read/write access to
-- rows scoped to the given org_id. Owners and active members both qualify.
-- Returns false for null inputs (callers should combine with `org_id IS NULL`
-- explicitly when they want to allow personal-workspace rows).

create or replace function has_org_access(target_org_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from organizations
    where id = target_org_id
      and owner_id = auth.uid()
  )
  or exists (
    select 1 from org_members
    where org_id = target_org_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

comment on function has_org_access(uuid) is
  'True if auth.uid() owns or is an active member of the given organisation. Used by RLS policies on org-partitioned tables.';

-- ---------------------------------------------------------------------------
-- 2. Add org_id columns + indexes to all per-client data tables
-- ---------------------------------------------------------------------------

alter table assessments              add column if not exists org_id uuid references organizations(id) on delete set null;
alter table technical_docs           add column if not exists org_id uuid references organizations(id) on delete set null;
alter table requirement_progress     add column if not exists org_id uuid references organizations(id) on delete set null;
alter table audit_log                add column if not exists org_id uuid references organizations(id) on delete set null;
alter table risk_management_plans    add column if not exists org_id uuid references organizations(id) on delete set null;
alter table logging_specs            add column if not exists org_id uuid references organizations(id) on delete set null;
alter table gdpr_assessments         add column if not exists org_id uuid references organizations(id) on delete set null;
alter table incidents                add column if not exists org_id uuid references organizations(id) on delete set null;
alter table conformity_share_tokens  add column if not exists org_id uuid references organizations(id) on delete set null;

create index if not exists assessments_org_idx              on assessments(org_id)             where org_id is not null;
create index if not exists technical_docs_org_idx           on technical_docs(org_id)          where org_id is not null;
create index if not exists requirement_progress_org_idx     on requirement_progress(org_id)    where org_id is not null;
create index if not exists audit_log_org_idx                on audit_log(org_id)               where org_id is not null;
create index if not exists risk_management_plans_org_idx    on risk_management_plans(org_id)   where org_id is not null;
create index if not exists logging_specs_org_idx            on logging_specs(org_id)           where org_id is not null;
create index if not exists gdpr_assessments_org_idx         on gdpr_assessments(org_id)        where org_id is not null;
create index if not exists incidents_org_idx                on incidents(org_id)               where org_id is not null;
create index if not exists conformity_share_tokens_org_idx  on conformity_share_tokens(org_id) where org_id is not null;

-- ---------------------------------------------------------------------------
-- 3. Replace RLS policies to honour org membership
-- ---------------------------------------------------------------------------
-- For each table, the access rule is:
--   user owns the row in their personal workspace (org_id IS NULL and user_id = auth.uid())
--   OR the row is scoped to an org and the current user has access to it
--
-- Each policy is dropped first (drop if exists) so the migration is idempotent
-- and so we replace the user-only policies created by the original migrations.

-- assessments
drop policy if exists "Users can manage their own assessments" on assessments;
drop policy if exists "Users manage own assessments" on assessments;
drop policy if exists "Org-aware assessment access" on assessments;
create policy "Org-aware assessment access" on assessments
  for all
  using (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  )
  with check (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  );

-- technical_docs
drop policy if exists "Users can manage their own technical docs" on technical_docs;
drop policy if exists "Users manage own technical docs" on technical_docs;
drop policy if exists "Org-aware technical_docs access" on technical_docs;
create policy "Org-aware technical_docs access" on technical_docs
  for all
  using (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  )
  with check (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  );

-- requirement_progress
drop policy if exists "Users can manage their own requirement progress" on requirement_progress;
drop policy if exists "Users manage own requirement progress" on requirement_progress;
drop policy if exists "Org-aware requirement_progress access" on requirement_progress;
create policy "Org-aware requirement_progress access" on requirement_progress
  for all
  using (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  )
  with check (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  );

-- audit_log
drop policy if exists "Users can read their own audit log" on audit_log;
drop policy if exists "Users manage own audit log" on audit_log;
drop policy if exists "Org-aware audit_log access" on audit_log;
create policy "Org-aware audit_log access" on audit_log
  for all
  using (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  )
  with check (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  );

-- risk_management_plans
drop policy if exists "Users can manage their own risk management plans" on risk_management_plans;
drop policy if exists "Org-aware risk_management_plans access" on risk_management_plans;
create policy "Org-aware risk_management_plans access" on risk_management_plans
  for all
  using (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  )
  with check (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  );

-- logging_specs
drop policy if exists "Users can manage their own logging specs" on logging_specs;
drop policy if exists "Org-aware logging_specs access" on logging_specs;
create policy "Org-aware logging_specs access" on logging_specs
  for all
  using (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  )
  with check (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  );

-- gdpr_assessments
drop policy if exists "Users can manage their own gdpr assessments" on gdpr_assessments;
drop policy if exists "Org-aware gdpr_assessments access" on gdpr_assessments;
create policy "Org-aware gdpr_assessments access" on gdpr_assessments
  for all
  using (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  )
  with check (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  );

-- incidents
drop policy if exists "Users manage own incidents" on incidents;
drop policy if exists "Org-aware incidents access" on incidents;
create policy "Org-aware incidents access" on incidents
  for all
  using (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  )
  with check (
    (org_id is null and user_id = auth.uid())
    or (org_id is not null and has_org_access(org_id))
  );

-- conformity_share_tokens
drop policy if exists "Users manage own share tokens" on conformity_share_tokens;
drop policy if exists "Org-aware conformity_share_tokens access" on conformity_share_tokens;
create policy "Org-aware conformity_share_tokens access" on conformity_share_tokens
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
-- 4. Trigger to inherit org_id from parent assessment on child-table inserts
-- ---------------------------------------------------------------------------
-- When a child record (technical_docs, gdpr_assessments, etc.) is inserted
-- without an explicit org_id, copy it from the parent assessment. This means
-- application code only has to set org_id at assessment-creation time;
-- everything that hangs off the assessment inherits automatically.

create or replace function inherit_org_id_from_assessment()
returns trigger
language plpgsql
as $$
begin
  if new.org_id is null and new.assessment_id is not null then
    select org_id into new.org_id from assessments where id = new.assessment_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_technical_docs_inherit_org          on technical_docs;
drop trigger if exists trg_requirement_progress_inherit_org    on requirement_progress;
drop trigger if exists trg_audit_log_inherit_org               on audit_log;
drop trigger if exists trg_risk_management_plans_inherit_org   on risk_management_plans;
drop trigger if exists trg_logging_specs_inherit_org           on logging_specs;
drop trigger if exists trg_gdpr_assessments_inherit_org        on gdpr_assessments;
drop trigger if exists trg_incidents_inherit_org               on incidents;
drop trigger if exists trg_conformity_share_tokens_inherit_org on conformity_share_tokens;

create trigger trg_technical_docs_inherit_org          before insert on technical_docs          for each row execute function inherit_org_id_from_assessment();
create trigger trg_requirement_progress_inherit_org    before insert on requirement_progress    for each row execute function inherit_org_id_from_assessment();
create trigger trg_audit_log_inherit_org               before insert on audit_log               for each row execute function inherit_org_id_from_assessment();
create trigger trg_risk_management_plans_inherit_org   before insert on risk_management_plans   for each row execute function inherit_org_id_from_assessment();
create trigger trg_logging_specs_inherit_org           before insert on logging_specs           for each row execute function inherit_org_id_from_assessment();
create trigger trg_gdpr_assessments_inherit_org        before insert on gdpr_assessments        for each row execute function inherit_org_id_from_assessment();
create trigger trg_incidents_inherit_org               before insert on incidents               for each row execute function inherit_org_id_from_assessment();
create trigger trg_conformity_share_tokens_inherit_org before insert on conformity_share_tokens for each row execute function inherit_org_id_from_assessment();

-- ---------------------------------------------------------------------------
-- 5. Notes for application code
-- ---------------------------------------------------------------------------
-- After this migration:
--   1. Application code creating an assessment can set org_id explicitly.
--      Personal-workspace assessments leave org_id null.
--   2. Child-table inserts inherit org_id automatically via the trigger.
--      No application changes required for child writes.
--   3. Existing read queries that filter only by user_id continue to work
--      because RLS allows personal-workspace rows (org_id IS NULL).
--   4. Org-scoped queries should add `.eq('org_id', activeOrgId)` to filter
--      to a specific org's data; the application is responsible for tracking
--      which org is currently active in the UI.
--   5. The conformity share-token public route uses the service-role admin
--      client which bypasses RLS — no change required there.
