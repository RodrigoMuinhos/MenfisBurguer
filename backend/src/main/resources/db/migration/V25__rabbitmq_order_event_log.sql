create table if not exists order_event_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  order_id text not null,
  payload jsonb not null,
  processed boolean not null default false,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (event_type, order_id)
);

create index if not exists idx_order_event_log_order on order_event_log(order_id, created_at desc);
create index if not exists idx_order_event_log_processed on order_event_log(processed, created_at);
create index if not exists idx_orders_kitchen_fifo on orders(test_mode, paid_at asc, number asc)
  where status in ('PAYMENT_APPROVED', 'PAID', 'ACCEPTED', 'IN_PREPARATION', 'READY');
