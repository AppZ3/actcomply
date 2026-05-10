-- May 2026 — per-organisation branding (logo URL + accent colour) for
-- white-label PDF / conformity-pack output. Surfaces on print pages and in
-- the dashboard when the workspace switcher is on a non-personal org.
--
-- Idempotent. Safe to re-run.

alter table organizations add column if not exists logo_url    text;
alter table organizations add column if not exists brand_color text;
alter table organizations add column if not exists brand_name  text; -- override display name on prints (e.g. legal entity name)

comment on column organizations.logo_url    is 'Public https URL of the org''s logo. Rendered in the header of generated PDFs and the dashboard workspace badge.';
comment on column organizations.brand_color is 'Hex colour like #0f172a used for accents on print pages.';
comment on column organizations.brand_name  is 'Display name override for prints (e.g. the registered legal entity name). Falls back to organizations.name when null.';
