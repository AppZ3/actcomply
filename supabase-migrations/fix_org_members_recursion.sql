-- Fix infinite recursion in org_members RLS policies.
-- Original policies (in add_organizations.sql) used `EXISTS (SELECT FROM org_members om2 ...)`
-- inside policies that gate org_members itself — Postgres recurses applying the same policy
-- to the subquery, throwing "infinite recursion detected in policy for relation org_members"
-- on every UPDATE / DELETE that's not by the owner.
--
-- Repro: owner attempts DELETE /api/orgs/{id}/members/{memberId} on a pending invite →
-- 500 with the recursion error.
--
-- Fix: route the admin check through a SECURITY DEFINER function so the recursive read
-- happens with elevated privileges and bypasses RLS.

create or replace function is_org_admin(target_org_id uuid)
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
      and role = 'admin'
      and status = 'active'
  );
$$;

comment on function is_org_admin(uuid) is
  'True if auth.uid() owns the org or is an active admin member. Used by RLS policies on org_members to avoid recursion.';

-- Drop the recursive policies and recreate them using is_org_admin().
drop policy if exists "Member access"               on org_members;
drop policy if exists "Member insert by owner or admin" on org_members;
drop policy if exists "Member update by owner or admin" on org_members;
drop policy if exists "Member delete by owner or admin" on org_members;

create policy "Member access"
  on org_members for select
  using (
    user_id = auth.uid()
    or is_org_admin(org_id)
  );

create policy "Member insert by owner or admin"
  on org_members for insert
  with check (is_org_admin(org_id));

create policy "Member update by owner or admin"
  on org_members for update
  using (
    is_org_admin(org_id)
    or user_id = auth.uid()
  );

create policy "Member delete by owner or admin"
  on org_members for delete
  using (is_org_admin(org_id));
