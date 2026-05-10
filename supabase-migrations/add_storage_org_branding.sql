-- Storage bucket for organisation branding assets (logos).
-- Public read so the URL can be embedded on prints and public conformity shares.
-- Writes only via the service role from /api/orgs/[orgId]/branding/logo
-- (owner-gated, no client-direct upload), so we don't need explicit user
-- INSERT/UPDATE/DELETE policies — RLS denies by default and the service role
-- bypasses RLS.
--
-- Idempotent: rerunning updates limits to the latest values without error.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'org-branding',
  'org-branding',
  true,
  2097152, -- 2 MB
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Explicit public-read policy so anonymous fetches return the asset.
drop policy if exists "org-branding public read" on storage.objects;
create policy "org-branding public read"
  on storage.objects for select
  using (bucket_id = 'org-branding');
