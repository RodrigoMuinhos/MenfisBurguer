-- V81-V83 were introduced after production had already advanced to V84+.
-- Reapply their idempotent schema changes at the current migration frontier.

alter table orders add column if not exists tracking_token_hash text;
alter table orders add column if not exists delivery_code text;

create unique index if not exists ux_orders_tracking_token_hash
  on orders(tracking_token_hash)
  where tracking_token_hash is not null;

update orders
set delivery_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
where delivery_code is null;

alter table orders alter column delivery_code set not null;

alter table webhook_events
  add column if not exists status text,
  add column if not exists received_at timestamptz not null default now(),
  add column if not exists processing_started_at timestamptz,
  add column if not exists attempts integer not null default 0,
  add column if not exists next_retry_at timestamptz,
  add column if not exists last_error text,
  add column if not exists resource_id text;

update webhook_events set status = 'PROCESSED' where status is null;

alter table webhook_events
  alter column status set default 'RECEIVED',
  alter column status set not null,
  alter column processed_at drop not null,
  alter column processed_at drop default;

alter table webhook_events drop constraint if exists webhook_events_status_check;
alter table webhook_events add constraint webhook_events_status_check
  check (status in ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED'));

create index if not exists idx_webhook_events_retry
  on webhook_events(next_retry_at)
  where status in ('RECEIVED', 'FAILED');

create table if not exists order_event_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_id text not null references orders(id) on delete cascade,
  origin text not null,
  occurred_at timestamptz not null,
  payload jsonb not null,
  status text not null default 'PENDING',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  processing_started_at timestamptz,
  published_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  constraint order_event_outbox_status_check
    check (status in ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED')),
  constraint uq_order_event_outbox_once unique (event_type, aggregate_id)
);

create index if not exists idx_order_event_outbox_dispatch
  on order_event_outbox(available_at, created_at)
  where status in ('PENDING', 'FAILED');
