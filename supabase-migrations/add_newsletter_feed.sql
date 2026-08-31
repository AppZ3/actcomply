-- Curated inbound feed for the newsletter.
--
-- Sources live in code (lib/feed-sources.ts) so adding one is a reviewable
-- commit. This table holds the items polled from them, plus the curation
-- verdict the composer writes back.
--
-- Access via service role only, matching newsletter_* tables.

create table if not exists feed_items (
  id              uuid primary key default gen_random_uuid(),
  -- Matches FEED_SOURCES[].key in lib/feed-sources.ts.
  source_key      text not null,
  -- Feed-provided guid, or the item URL when the feed omits one.
  guid            text not null,
  url             text not null,
  title           text not null,
  summary         text,
  published_at    timestamptz,
  fetched_at      timestamptz not null default now(),

  -- Curation, written by the composer. Null until an item has been scored.
  relevance       int check (relevance is null or (relevance >= 0 and relevance <= 100)),
  why_it_matters  text,
  scored_at       timestamptz,

  -- Set once an item has appeared in an issue, so it is never used twice.
  used_in_issue   uuid references newsletter_issues(id) on delete set null,

  unique (source_key, guid)
);

alter table feed_items enable row level security;

drop policy if exists "service role only" on feed_items;
create policy "service role only" on feed_items
  for all
  to anon, authenticated
  using (false)
  with check (false);

create index if not exists feed_items_published_idx on feed_items(published_at desc);
create index if not exists feed_items_unused_idx on feed_items(published_at desc) where used_in_issue is null;
create index if not exists feed_items_relevance_idx on feed_items(relevance desc nulls last);
create index if not exists feed_items_source_idx on feed_items(source_key);
