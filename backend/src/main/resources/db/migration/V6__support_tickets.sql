create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders(id) on delete cascade,
  type text not null,
  reason text not null,
  message text,
  customer_phone text,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_support_tickets_order_id on support_tickets(order_id);
create index if not exists idx_support_tickets_status_created on support_tickets(status, created_at desc);
create index if not exists idx_support_tickets_type_created on support_tickets(type, created_at desc);
