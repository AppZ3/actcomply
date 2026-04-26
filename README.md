# ActComply — EU AI Act Compliance Platform

AI-powered compliance platform that classifies AI systems under the EU AI Act (Regulation EU 2024/1689), generates Article 11 technical documentation, and tracks compliance progress toward the August 2, 2026 enforcement deadline.

**Live:** [getactcomply.com](https://getactcomply.com)

---

## What it does

1. **Assess** — Describe an AI system; Claude classifies it as Prohibited, High-Risk, Limited-Risk, or Minimal-Risk with article-level regulatory basis
2. **Document** — Generates Annex IV-compliant technical documentation (10 sections) as a downloadable PDF
3. **Track** — Checklist of compliance requirements per system with progress tracking
4. **Alert** — Regulatory change alerts with severity levels pushed to users by email

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, server components) |
| Language | TypeScript |
| AI | Anthropic Claude (Opus for assessments, Haiku for docs/validation) |
| Auth | Supabase Auth (magic link + OAuth) |
| Database | Supabase (Postgres + RLS) |
| Payments | Stripe (subscriptions + usage-based billing) |
| Email | Resend |
| Deployment | Vercel |

---

## Architecture

```
app/
  (dashboard)/        # Authenticated dashboard routes
    dashboard/
      systems/[id]/   # System detail, checklist, docs, print/PDF
  api/
    assess/           # POST — run AI assessment via Claude
    docs/[id]/        # GET/POST — fetch or generate technical documentation
    audit/            # GET — AI decision audit trail (Business plan+)
    alerts/           # GET/PATCH — regulatory alerts
    progress/         # POST — update compliance checklist items
    billing/          # Stripe checkout and portal
    webhooks/stripe/  # Stripe webhook handler
    welcome/          # Post-signup welcome email trigger
lib/
  anthropic.ts        # Claude integration: assessment, validation, PII masking, retry
  eu-ai-act.ts        # Risk categories, requirements, prohibited indicators
  stripe.ts           # Plan definitions and feature gates
  supabase-server.ts  # Server-side Supabase client (SSR cookies)
  supabase-admin.ts   # Service role client for RLS bypass
  resend.ts           # Transactional email helpers
```

---

## API reference

### `POST /api/assess`
Run an EU AI Act compliance assessment.

**Request body:**
```json
{
  "name": "string",
  "description": "string",
  "purpose": "string",
  "sector": "string",
  "usesPersonalData": true,
  "makesAutonomousDecisions": false,
  "affectsIndividuals": true,
  "currentSafeguards": "string"
}
```

**Response:**
```json
{
  "riskLevel": "HIGH_RISK",
  "riskRationale": "string",
  "regulatoryBasis": "Articles 6, 10, Annex III",
  "complianceScore": 42,
  "immediateActions": ["..."],
  "estimatedEffort": "2-4 months",
  "requirements": [...],
  "savedId": "uuid"
}
```

### `GET /api/docs/:assessmentId`
Fetch existing technical documentation for an assessment.

### `POST /api/docs/:assessmentId`
Generate Annex IV technical documentation via Claude. Requires Business plan.

### `GET /api/audit?assessmentId=:id`
Retrieve AI decision audit log for an assessment. Requires Business plan.

### `GET /api/alerts`
List regulatory alerts for the authenticated user.

### `POST /api/progress`
Update compliance checklist item status (`not_started` | `in_progress` | `done`).

---

## AI governance

All Claude API calls include:

- **Input sanitisation** — prompt injection patterns stripped before sending user content
- **PII masking** — emails, phone numbers, card numbers, SSNs masked before reaching the Anthropic API
- **Retry with backoff** — up to 3 retries on 429/5xx responses with exponential backoff
- **Audit logging** — every AI assessment decision logged to `audit_log` with model, risk level, score, latency, and token usage
- **Structured output** — assessments use tool_use / JSON-mode to prevent unstructured generation

---

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ANTHROPIC_API_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

RESEND_API_KEY=

NEXT_PUBLIC_SITE_URL=https://getactcomply.com
```

---

## Local development

```bash
npm install
cp .env.example .env.local   # fill in env vars
npm run dev                   # http://localhost:3000
```

Supabase migrations are in `supabase/migrations/`. Run with `supabase db push`.

---

## Plans

| Plan | Systems | Tech docs | Audit trail | White label |
|---|---|---|---|---|
| Free | 1 | — | — | — |
| Starter | 5 | — | — | — |
| Business | Unlimited | ✓ | ✓ | — |
| Enterprise | Unlimited | ✓ | ✓ | ✓ |

---

## License

Private — all rights reserved. Not open source.
