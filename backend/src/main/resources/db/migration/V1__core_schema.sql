create sequence if not exists order_number_seq start 1001;

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  login text not null unique,
  password_hash text not null,
  role text not null default 'ADMIN',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id bigserial primary key,
  cpf text unique,
  phone text,
  cep text,
  street text,
  house_number text,
  complement text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id bigint references customers(id),
  cep text not null,
  street text not null,
  house_number text not null,
  complement text,
  neighborhood text,
  city text,
  state text,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  name text not null,
  description text,
  base_price numeric(12,2) not null,
  active boolean not null default true,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists addons (
  id text primary key,
  name text not null,
  price numeric(12,2) not null,
  active boolean not null default true
);

create table if not exists combos (
  id text primary key,
  name text not null,
  price numeric(12,2) not null,
  active boolean not null default true
);

create table if not exists orders (
  id text primary key,
  number bigint not null unique,
  items jsonb not null default '[]'::jsonb,
  removed_by_item_id jsonb,
  delivery_type text not null,
  customer_phone text,
  customer_address text,
  total numeric(12,2) not null,
  payment_provider text,
  payment_method text,
  payment_status text not null default 'not_required',
  payment_id text,
  timestamp bigint not null default (extract(epoch from now()) * 1000)::bigint,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table orders add column if not exists customer_id bigint references customers(id);
alter table orders add column if not exists subtotal numeric(12,2);
alter table orders add column if not exists delivery_fee numeric(12,2) not null default 0;
alter table orders add column if not exists idempotency_key text;
alter table orders add column if not exists paid_at timestamptz;
alter table orders add column if not exists confirmed_at timestamptz;
alter table orders add column if not exists canceled_at timestamptz;
alter table orders add column if not exists channel text not null default 'WEB';

create unique index if not exists ux_orders_idempotency_key on orders(idempotency_key) where idempotency_key is not null;
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_number_desc on orders(number desc);
create index if not exists idx_orders_confirmed_at on orders(confirmed_at asc);
create index if not exists idx_orders_payment_status on orders(payment_status);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders(id) on delete cascade,
  product_id text references products(id),
  item_type text not null,
  name text not null,
  quantity integer not null,
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) not null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders(id) on delete cascade,
  provider text not null,
  provider_payment_id text,
  provider_preference_id text,
  method text not null,
  status text not null,
  amount numeric(12,2) not null,
  checkout_url text,
  qr_code text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_payments_provider_payment_id on payments(provider, provider_payment_id) where provider_payment_id is not null;

create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique references orders(id) on delete cascade,
  type text not null,
  fee numeric(12,2) not null default 0,
  address text,
  eta_min integer,
  eta_max integer,
  status text not null default 'PENDING'
);

create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by text,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists inventory_items (
  id text primary key,
  name text not null,
  unit text not null,
  quantity numeric(12,3) not null default 0,
  min_quantity numeric(12,3) not null default 0,
  expires_at date,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists product_ingredients (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id),
  inventory_item_id text not null references inventory_items(id),
  quantity numeric(12,3) not null
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id text not null references inventory_items(id),
  order_id text references orders(id),
  type text not null,
  quantity numeric(12,3) not null,
  quantity_before numeric(12,3) not null,
  quantity_after numeric(12,3) not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists webhook_events (
  id text primary key,
  provider text not null,
  event_type text,
  processed_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);
