-- Multi-entity isolation test — paste into Supabase SQL editor and run.
-- Self-cleaning: every row created here is deleted at the end of the block.
-- Watch the "Notices" tab for ✅ / ❌ results.
--
-- What this verifies:
--   1. The BEFORE INSERT trigger auto-populates org_id on child tables
--      (technical_docs, risk_management_plans, gdpr_assessments,
--      logging_specs) when the parent assessment has org_id set.
--   2. Isolation: simulating the queries the UI runs in personal vs org
--      context returns the correct rows in each.
--   3. Cross-org isolation: data in Org A is invisible to Org B.

do $$
declare
  uid uuid;
  org_a uuid;
  org_b uuid;
  asmt_personal uuid;
  asmt_a uuid;
  asmt_b uuid;
  child_org_id uuid;
  cnt int;
  pass int := 0;
  fail int := 0;
begin
  -- ---- Setup ------------------------------------------------------------
  select id into uid from auth.users where email = 'zaclowe@outlook.com.au';
  if uid is null then raise exception 'User not found in auth.users'; end if;
  raise notice 'Test user_id: %', uid;

  insert into organizations (owner_id, name)
    values (uid, 'TEST_ORG_A_' || floor(random()*1000000)::text)
    returning id into org_a;
  insert into organizations (owner_id, name)
    values (uid, 'TEST_ORG_B_' || floor(random()*1000000)::text)
    returning id into org_b;
  raise notice 'Created two test orgs (A=%, B=%)', org_a, org_b;

  -- Create three assessments: personal, in org A, in org B.
  -- Mirrors the full field set the API writes (api/assess/route.ts) so we
  -- don't trip on NOT NULL constraints we didn't know about.
  insert into assessments (
    user_id, org_id, name, description, purpose, sector,
    uses_personal_data, makes_autonomous_decisions, affects_individuals,
    current_safeguards, risk_level, compliance_score,
    risk_rationale, regulatory_basis, requirements,
    immediate_actions, estimated_effort
  ) values (
    uid, null,  'TEST_personal', 'p', 'p', 'hr',
    false, false, false,
    'test', 'HIGH_RISK', 30,
    'test', 'test', '[]'::jsonb,
    '["test"]'::jsonb, 'test'
  ) returning id into asmt_personal;

  insert into assessments (
    user_id, org_id, name, description, purpose, sector,
    uses_personal_data, makes_autonomous_decisions, affects_individuals,
    current_safeguards, risk_level, compliance_score,
    risk_rationale, regulatory_basis, requirements,
    immediate_actions, estimated_effort
  ) values (
    uid, org_a, 'TEST_in_A', 'a', 'a', 'hr',
    false, false, false,
    'test', 'HIGH_RISK', 30,
    'test', 'test', '[]'::jsonb,
    '["test"]'::jsonb, 'test'
  ) returning id into asmt_a;

  insert into assessments (
    user_id, org_id, name, description, purpose, sector,
    uses_personal_data, makes_autonomous_decisions, affects_individuals,
    current_safeguards, risk_level, compliance_score,
    risk_rationale, regulatory_basis, requirements,
    immediate_actions, estimated_effort
  ) values (
    uid, org_b, 'TEST_in_B', 'b', 'b', 'hr',
    false, false, false,
    'test', 'HIGH_RISK', 30,
    'test', 'test', '[]'::jsonb,
    '["test"]'::jsonb, 'test'
  ) returning id into asmt_b;

  -- ---- Test 1: trigger inherits org_id on technical_docs ----------------
  insert into technical_docs (user_id, assessment_id, sections, generated_at)
    values (uid, asmt_a, '{}'::jsonb, now());
  select org_id into child_org_id from technical_docs where assessment_id = asmt_a;
  if child_org_id = org_a then
    raise notice '✅ trigger: technical_docs inherits org_id from assessment';
    pass := pass + 1;
  else
    raise warning '❌ trigger: technical_docs org_id is %, expected %', child_org_id, org_a;
    fail := fail + 1;
  end if;

  -- ---- Test 2: same trigger on risk_management_plans --------------------
  insert into risk_management_plans (user_id, assessment_id, content, generated_at)
    values (uid, asmt_a, '{}'::jsonb, now());
  select org_id into child_org_id from risk_management_plans where assessment_id = asmt_a;
  if child_org_id = org_a then
    raise notice '✅ trigger: risk_management_plans inherits org_id';
    pass := pass + 1;
  else
    raise warning '❌ trigger: risk_management_plans org_id is %, expected %', child_org_id, org_a;
    fail := fail + 1;
  end if;

  -- ---- Test 3: same trigger on gdpr_assessments -------------------------
  insert into gdpr_assessments (user_id, assessment_id, content, generated_at)
    values (uid, asmt_a, '{}'::jsonb, now());
  select org_id into child_org_id from gdpr_assessments where assessment_id = asmt_a;
  if child_org_id = org_a then
    raise notice '✅ trigger: gdpr_assessments inherits org_id';
    pass := pass + 1;
  else
    raise warning '❌ trigger: gdpr_assessments org_id is %, expected %', child_org_id, org_a;
    fail := fail + 1;
  end if;

  -- ---- Test 4: same trigger on logging_specs ----------------------------
  insert into logging_specs (user_id, assessment_id, content, generated_at)
    values (uid, asmt_a, '{}'::jsonb, now());
  select org_id into child_org_id from logging_specs where assessment_id = asmt_a;
  if child_org_id = org_a then
    raise notice '✅ trigger: logging_specs inherits org_id';
    pass := pass + 1;
  else
    raise warning '❌ trigger: logging_specs org_id is %, expected %', child_org_id, org_a;
    fail := fail + 1;
  end if;

  -- ---- Test 5: explicit org_id is NOT overwritten by trigger ------------
  insert into technical_docs (user_id, assessment_id, org_id, sections, generated_at)
    values (uid, asmt_b, org_b, '{"explicit":true}'::jsonb, now());
  select org_id into child_org_id from technical_docs
    where assessment_id = asmt_b and sections::text like '%explicit%';
  if child_org_id = org_b then
    raise notice '✅ trigger: respects explicit org_id (does not overwrite)';
    pass := pass + 1;
  else
    raise warning '❌ trigger: overwrote explicit org_id (got %, expected %)', child_org_id, org_b;
    fail := fail + 1;
  end if;

  -- ---- Test 6: simulate "active workspace = personal" UI query ----------
  -- Mirrors app/(dashboard)/dashboard/systems/page.tsx personal branch:
  --   .is('org_id', null).eq('user_id', uid)
  select count(*) into cnt from assessments
    where org_id is null and user_id = uid and name like 'TEST_%';
  if cnt = 1 then
    raise notice '✅ isolation: personal workspace shows 1 of 3 test assessments';
    pass := pass + 1;
  else
    raise warning '❌ isolation: personal workspace returned % assessments (expected 1)', cnt;
    fail := fail + 1;
  end if;

  -- ---- Test 7: simulate "active workspace = Org A" UI query --------------
  --   .eq('org_id', org_a)
  select count(*) into cnt from assessments
    where org_id = org_a and name like 'TEST_%';
  if cnt = 1 then
    raise notice '✅ isolation: Org A shows 1 of 3 test assessments';
    pass := pass + 1;
  else
    raise warning '❌ isolation: Org A returned % assessments (expected 1)', cnt;
    fail := fail + 1;
  end if;

  -- ---- Test 8: simulate "active workspace = Org B" UI query --------------
  select count(*) into cnt from assessments
    where org_id = org_b and name like 'TEST_%';
  if cnt = 1 then
    raise notice '✅ isolation: Org B shows 1 of 3 test assessments';
    pass := pass + 1;
  else
    raise warning '❌ isolation: Org B returned % assessments (expected 1)', cnt;
    fail := fail + 1;
  end if;

  -- ---- Test 9: per-org export endpoint logic ----------------------------
  -- Mirrors app/api/export/org/[orgId]/route.ts: filter assessments by
  -- org_id, then pull child records by assessment_id IN (...)
  select count(*) into cnt from technical_docs
    where assessment_id in (select id from assessments where org_id = org_a);
  if cnt = 1 then
    raise notice '✅ export: per-org export sees Org A''s 1 tech_doc';
    pass := pass + 1;
  else
    raise warning '❌ export: per-org export saw % tech_docs for Org A (expected 1)', cnt;
    fail := fail + 1;
  end if;

  -- ---- Cleanup ----------------------------------------------------------
  delete from technical_docs       where assessment_id in (asmt_personal, asmt_a, asmt_b);
  delete from risk_management_plans where assessment_id in (asmt_personal, asmt_a, asmt_b);
  delete from gdpr_assessments      where assessment_id in (asmt_personal, asmt_a, asmt_b);
  delete from logging_specs         where assessment_id in (asmt_personal, asmt_a, asmt_b);
  delete from assessments           where id in (asmt_personal, asmt_a, asmt_b);
  delete from organizations         where id in (org_a, org_b);

  -- ---- Summary ----------------------------------------------------------
  raise notice '====================================';
  raise notice '%/%: % passed, % failed', pass+fail, pass+fail, pass, fail;
  raise notice '====================================';
end $$;
