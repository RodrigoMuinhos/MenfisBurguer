create table dining_tables (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  area text not null,
  active boolean not null default true,
  position_x integer,
  position_y integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table table_kits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  qr_token text not null unique,
  status text not null default 'AVAILABLE',
  light_state text not null default 'OFF',
  active boolean not null default true,
  device_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_table_kits_status check (status in ('AVAILABLE', 'IN_USE', 'OFFLINE', 'DISABLED')),
  constraint ck_table_kits_light_state check (light_state in ('NORMAL', 'BLUE', 'GREEN', 'RED', 'OFF')),
  constraint ck_table_kits_qr_token_length check (char_length(qr_token) >= 32)
);

create table dining_sessions (
  id uuid primary key default gen_random_uuid(),
  public_id uuid not null default gen_random_uuid() unique,
  table_id uuid not null references dining_tables(id),
  table_kit_id uuid not null references table_kits(id),
  customer_name text,
  status text not null default 'OPEN',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opened_by_staff_id uuid references admins(id),
  closed_by_staff_id uuid references admins(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_dining_sessions_status check (status in ('OPEN', 'CLOSED', 'CANCELLED')),
  constraint ck_dining_sessions_closed_at check (
    (status = 'OPEN' and closed_at is null) or
    (status in ('CLOSED', 'CANCELLED') and closed_at is not null)
  )
);

create unique index ux_dining_sessions_open_table
  on dining_sessions(table_id) where status = 'OPEN';

create unique index ux_dining_sessions_open_kit
  on dining_sessions(table_kit_id) where status = 'OPEN';

create index idx_dining_sessions_status on dining_sessions(status);
create index idx_dining_sessions_public_id on dining_sessions(public_id);

create table table_light_events (
  id uuid primary key default gen_random_uuid(),
  table_kit_id uuid not null references table_kits(id),
  dining_session_id uuid references dining_sessions(id),
  previous_state text,
  new_state text not null,
  actor_user_id uuid references admins(id),
  actor text,
  reason text,
  created_at timestamptz not null default now(),
  constraint ck_table_light_events_previous_state check (
    previous_state is null or previous_state in ('NORMAL', 'BLUE', 'GREEN', 'RED', 'OFF')
  ),
  constraint ck_table_light_events_new_state check (
    new_state in ('NORMAL', 'BLUE', 'GREEN', 'RED', 'OFF')
  )
);

alter table orders add column if not exists fulfillment_type text;
alter table orders add column if not exists dining_session_id uuid references dining_sessions(id);

update orders
set fulfillment_type = case
  when delivery_type = 'DELIVERY' then 'DELIVERY'
  else 'COUNTER_PICKUP'
end
where fulfillment_type is null;

alter table orders alter column fulfillment_type set not null;
alter table orders alter column fulfillment_type set default 'COUNTER_PICKUP';

alter table orders add constraint ck_orders_fulfillment_type
  check (fulfillment_type in ('DELIVERY', 'COUNTER_PICKUP'));

alter table orders add constraint ck_orders_dining_qr_context
  check (
    channel <> 'DINING_QR' or (
      dining_session_id is not null and
      fulfillment_type = 'COUNTER_PICKUP' and
      delivery_type = 'RETIRADA' and
      delivery_fee = 0
    )
  );

create index idx_orders_dining_session_id on orders(dining_session_id)
  where dining_session_id is not null;
