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

create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by text,
  reason text,
  created_at timestamptz not null default now()
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

alter table orders add column if not exists subtotal numeric(12,2);
alter table orders add column if not exists delivery_fee numeric(12,2) not null default 0;
alter table orders add column if not exists idempotency_key text;
alter table orders add column if not exists paid_at timestamptz;
alter table orders add column if not exists confirmed_at timestamptz;
alter table orders add column if not exists canceled_at timestamptz;
alter table orders add column if not exists channel text not null default 'WEB';

insert into products (id, name, description, base_price, active)
values
  ('burger', 'Menfi''s Burger', 'Pão brioche, burger 100g, queijo, alface, cebola caramelizada e molho Menfi''s', 24.90, true),
  ('double-burger', 'Double Menfi''s', 'Menfi''s Burger com dois burgers', 34.90, true),
  ('batata', 'Batata Frita 250g', 'Porção de batata frita', 12.00, true),
  ('cola', 'Coca-Cola 350ml', 'Refrigerante lata', 6.00, true)
on conflict (id) do update set name = excluded.name, base_price = excluded.base_price, active = excluded.active;

insert into addons (id, name, price, active)
values
  ('extra-queijo', 'Queijo extra', 4.00, true),
  ('extra-ovo', 'Ovo adicional', 3.50, true),
  ('extra-molho', 'Molho extra', 2.50, true),
  ('combo-upgrade', 'Combo batata + Coca-Cola', 14.90, true)
on conflict (id) do update set name = excluded.name, price = excluded.price, active = excluded.active;

insert into combos (id, name, price, active)
values
  ('combo', 'Menfi''s Combo', 38.90, true),
  ('double-combo', 'Double Menfi''s Combo', 48.90, true)
on conflict (id) do update set name = excluded.name, price = excluded.price, active = excluded.active;

insert into inventory_items (id, name, unit, quantity, min_quantity)
values
  ('pao-brioche', 'Pão brioche', 'un', 100, 20),
  ('carne-70-30', 'Carne 70/30', 'kg', 20, 5),
  ('queijo', 'Queijo', 'un', 120, 20),
  ('alface', 'Alface', 'un', 40, 8),
  ('molho', 'Molho Menfi''s', 'g', 6000, 1200),
  ('batata', 'Batata frita', 'kg', 25, 5),
  ('coca-cola', 'Coca-Cola 350ml', 'un', 80, 15)
on conflict (id) do update set name = excluded.name, unit = excluded.unit, min_quantity = excluded.min_quantity;

insert into product_ingredients (product_id, inventory_item_id, quantity)
select product_id, inventory_item_id, quantity
from (
  values
    ('burger', 'pao-brioche', 1),
    ('burger', 'carne-70-30', 0.1),
    ('burger', 'queijo', 1),
    ('burger', 'alface', 0.5),
    ('burger', 'molho', 30),
    ('double-burger', 'pao-brioche', 1),
    ('double-burger', 'carne-70-30', 0.2),
    ('double-burger', 'queijo', 2),
    ('double-burger', 'alface', 0.5),
    ('double-burger', 'molho', 40),
    ('batata', 'batata', 0.25),
    ('cola', 'coca-cola', 1)
) as seed(product_id, inventory_item_id, quantity)
where not exists (
  select 1 from product_ingredients pi
  where pi.product_id = seed.product_id and pi.inventory_item_id = seed.inventory_item_id
);
