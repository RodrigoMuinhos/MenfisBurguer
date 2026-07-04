create table if not exists order_lifecycle_event_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  order_id text not null references orders(id) on delete cascade,
  from_status text,
  to_status text,
  origin text,
  actor text,
  reason text,
  payload jsonb not null default '{}'::jsonb,
  published_at timestamptz not null default now(),
  consumed boolean not null default false,
  consumed_at timestamptz
);

create index if not exists idx_order_lifecycle_event_order on order_lifecycle_event_log(order_id, published_at desc);
create index if not exists idx_order_lifecycle_event_type on order_lifecycle_event_log(event_type, published_at desc);
create index if not exists idx_order_lifecycle_event_consumed on order_lifecycle_event_log(consumed, published_at);
