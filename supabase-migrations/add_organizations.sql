-- Multi-entity / group management (Enterprise)
-- An org owner can invite members; members share access to the org's assessments

create table if not exists organizations (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists org_members (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  email           text not null,
  role            text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  status          text not null default 'pending' check (status in ('pending', 'active')),
  invited_at      timestamptz not null default now(),
  accepted_at     timestamptz,
  unique (org_id, email)
);

create index if not exists org_members_org_idx  on org_members(org_id);
create index if not exists org_members_user_idx on org_members(user_id);
create index if not exists org_members_email_idx on org_members(email);

alter table organizations enable row level security;
alter table org_members   enable row level security;

-- Org owners see their orgs; members see orgs they belong to
create policy "Org access"
  on organizations for all
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from org_members
      where org_id = organizations.id
        and user_id = auth.uid()
        and status = 'active'
    )
  )
  with check (owner_id = auth.uid());

-- Org owners and admins manage members; members see their own row
create policy "Member access"
  on org_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from organizations
      where id = org_members.org_id
        and owner_id = auth.uid()
    )
    or exists (
      select 1 from org_members om2
      where om2.org_id = org_members.org_id
        and om2.user_id = auth.uid()
        and om2.role = 'admin'
        and om2.status = 'active'
    )
  );

create policy "Member insert by owner or admin"
  on org_members for insert
  with check (
    exists (
      select 1 from organizations
      where id = org_members.org_id
        and owner_id = auth.uid()
    )
    or exists (
      select 1 from org_members om2
      where om2.org_id = org_members.org_id
        and om2.user_id = auth.uid()
        and om2.role = 'admin'
        and om2.status = 'active'
    )
  );

create policy "Member update by owner or admin"
  on org_members for update
  using (
    exists (
      select 1 from organizations
      where id = org_members.org_id
        and owner_id = auth.uid()
    )
    or exists (
      select 1 from org_members om2
      where om2.org_id = org_members.org_id
        and om2.user_id = auth.uid()
        and om2.role = 'admin'
        and om2.status = 'active'
    )
    or (user_id = auth.uid())
  );

create policy "Member delete by owner or admin"
  on org_members for delete
  using (
    exists (
      select 1 from organizations
      where id = org_members.org_id
        and owner_id = auth.uid()
    )
    or exists (
      select 1 from org_members om2
      where om2.org_id = org_members.org_id
        and om2.user_id = auth.uid()
        and om2.role = 'admin'
        and om2.status = 'active'
    )
  );
