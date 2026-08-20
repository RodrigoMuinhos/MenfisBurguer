create table order_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_id text not null,
  payload jsonb not null,
  status text not null default 'PENDING',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  published_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_order_outbox_status check (status in ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED')),
  constraint ux_order_outbox_event unique (event_type, aggregate_id)
);

create index idx_order_outbox_dispatch
  on order_outbox(available_at, created_at)
  where status in ('PENDING', 'FAILED', 'PROCESSING');
