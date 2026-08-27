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

