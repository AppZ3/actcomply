-- Auto-claim pending org_members rows when a new user signs up with the matching email.
--
-- Without this, the invite flow leaks: someone is invited (status='pending', user_id=NULL),
-- they later sign up with the matching email, but the invite stays orphaned forever.
-- They never see the org in their workspace switcher because RLS gates by user_id.
--
-- The existing handle_new_user() trigger (created on auth.users by add_organizations.sql /
-- the migration memo) inserts a profiles row when auth.users gains a row. We add a parallel
-- claim trigger that runs after the same event and binds any pending invites by email.
--
-- Idempotent: drops + recreates the function and trigger.

create or replace function public.claim_pending_org_invites()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Bind every pending invite for this email to the new user.
  -- Lowercased compare matches how the invite endpoint stores emails.
  update public.org_members
     set user_id     = new.id,
         status      = 'active',
         accepted_at = now()
   where lower(email) = lower(new.email)
     and user_id is null
     and status = 'pending';
  return new;
end;
$$;

comment on function public.claim_pending_org_invites() is
  'Binds pending org_members invites (matched by email) to the user_id of a newly-created auth user.';

drop trigger if exists on_auth_user_claim_invites on auth.users;
create trigger on_auth_user_claim_invites
  after insert on auth.users
  for each row
  execute function public.claim_pending_org_invites();
