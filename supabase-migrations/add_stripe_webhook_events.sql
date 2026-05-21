-- Idempotency log for Stripe webhook deliveries.
-- The Stripe handler INSERTs the event_id at the very top; ON CONFLICT signals
-- a redelivery and short-circuits the handler with 200, so legitimate retries
-- (or a replayed signed body within Stripe's 5-min tolerance) do not re-fire
-- magic-link emails, invites, or duplicate profile updates.

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies. Service-role-only access from app/api/webhooks/stripe/route.ts.
