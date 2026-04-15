# ActComply — Maintenance & Scaling Checklist

**Last updated:** April 2026  
**Platform:** getactcomply.com

---

## Do This When You Get Your First Customer

| Task | Why |
|------|-----|
| Upgrade Vercel to Pro (~$20/month) | Unlocks 60s function timeout — required for Technical Documentation generator. Currently times out on Hobby. |
| Set `ANALYSIS_MODE=full` in Vercel env vars (outreach tool) | Enables full AI support pipeline with GitHub PR creation. Quick mode is active now. |
| Verify Stripe is in live mode (not test mode) | Ensure real payments are being processed. Check `STRIPE_SECRET_KEY` starts with `sk_live_` not `sk_test_`. |
| Test full checkout → webhook → plan activation flow | Pay with a real card, verify `profiles.plan` updates in Supabase within 60 seconds. |
| Delete test alert from Supabase | `regulatory_alerts` table — row titled "Test alert — ActComply notifications active". |

---

## Ongoing Monitoring

### Weekly
- **Supabase table editor** → `profiles` — check for any rows with stale/invalid `stripe_customer_id` (will cause billing portal errors)
- **Vercel logs** → look for repeated 500 errors on `/api/assess` or `/api/docs/[id]`
- **Resend dashboard** → check delivery rate on alert emails. Bounces hurt domain reputation.
- **Stripe dashboard** → review any failed payments or disputed charges

### Monthly
- **Push a new regulatory alert** via:
  ```bash
  curl -X POST https://www.getactcomply.com/api/alerts \
    -H "Authorization: Bearer <ALERTS_ADMIN_SECRET>" \
    -H "Content-Type: application/json" \
    -d '{"title":"...","summary":"...","article_refs":"Article X","severity":"critical"}'
  ```
- **Healthcheck** → `curl https://getactcomply.com/api/healthcheck` — all checks should be green
- **Review outreach campaign stats** → reply rate, bounce rate, unsubscribes

### When EU AI Act Guidance Updates
- Update the `SEED_ALERTS` array in `app/api/alerts/route.ts` so new users see up-to-date alerts
- Check if any `REQUIREMENTS` in `lib/eu-ai-act.ts` need updating for new guidance
- Push a new alert to all active users via the API above

---

## Scaling Triggers

| When | Action |
|------|--------|
| 100+ assessments/day | Add caching to `/api/assess` results for identical inputs |
| 50+ active users | Enable Supabase connection pooling (PgBouncer) |
| Timeouts on `/api/assess` | Increase Vercel function memory in `next.config.js` |
| High Anthropic API costs | Switch assessment model from Opus to Sonnet for free-tier users |
| Stripe webhooks missing | Check webhook signing secret — re-register at stripe.com/webhooks if needed |
| Alert emails going to spam | Check Resend domain reputation, add DMARC reporting |

---

## Environment Variables — Full List

Stored in **Vercel → aiact-platform → Settings → Environment Variables**

| Variable | What it is |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public, safe in browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, never expose) |
| `ANTHROPIC_API_KEY` | Claude API key |
| `STRIPE_SECRET_KEY` | Stripe secret key (live: `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_STARTER_PRICE_ID` | Stripe price ID for Starter monthly |
| `STRIPE_STARTER_ANNUAL_PRICE_ID` | Stripe price ID for Starter annual |
| `STRIPE_BUSINESS_PRICE_ID` | Stripe price ID for Business monthly |
| `STRIPE_BUSINESS_ANNUAL_PRICE_ID` | Stripe price ID for Business annual |
| `STRIPE_ENTERPRISE_PRICE_ID` | Stripe price ID for Enterprise monthly |
| `STRIPE_ENTERPRISE_ANNUAL_PRICE_ID` | Stripe price ID for Enterprise annual |
| `RESEND_API_KEY` | Resend API key for alert emails |
| `ALERTS_ADMIN_SECRET` | Secret to protect POST /api/alerts endpoint |
| `NEXT_PUBLIC_APP_URL` | `https://getactcomply.com` |

---

## Supabase Tables — Reference

| Table | Purpose |
|-------|---------|
| `profiles` | One row per user. Stores plan, stripe IDs, systems_limit. Created by `handle_new_user` trigger on signup. |
| `assessments` | One row per AI system assessment. Stores full result JSON. |
| `requirement_progress` | Checklist status per requirement per user per assessment. |
| `technical_docs` | Generated Article 11 documentation per assessment. |
| `regulatory_alerts` | EU AI Act alerts shown in dashboard. Add new ones via API. |
| `alert_reads` | Tracks which users have read which alerts. |
| `audit_log` | Log of requirement status changes per user. |

**If a user's profile is missing** (dashboard shows blank or errors):
```sql
insert into profiles (id, email, plan, systems_limit, created_at, updated_at)
select id, email, 'free', 1, now(), now()
from auth.users
where id = '<user-uuid>'
on conflict (id) do nothing;
```

---

## Known Limitations (Fix When Relevant)

| Issue | Status | Fix |
|-------|--------|-----|
| Technical Documentation times out | Active — Vercel Hobby 10s limit | Upgrade to Vercel Pro |
| Conformity template detail pages not built | Low priority | Build `/dashboard/guidance/template/[id]` pages with full template content |
| Audit trail not surfaced in UI | Low priority | Add an audit history tab to the system detail page |
| Mobile layout broken | Low priority | Sidebar is fixed 240px — needs responsive drawer for mobile |
| `profiles.email` column required for webhook | Verify | Run `select email from profiles limit 5` in Supabase to confirm column exists |

---

## Key Contacts & Credentials

| Service | Login | Notes |
|---------|-------|-------|
| Vercel | appzai37@gmail.com | Two projects: actcomply + outreach-tool |
| Supabase | appzai37@gmail.com | One project shared by platform |
| Stripe | appzai37@gmail.com | Live mode — check mode toggle top-right |
| Resend | appzai37@gmail.com | Domain: getactcomply.com verified |
| Namecheap | appzai37@gmail.com | DNS for getactcomply.com |
| Anthropic | appzai37@gmail.com | API key in Vercel env vars |
| GitHub | AppZ3 | Repos: AppZ3/actcomply, AppZ3/outreach-tool |
