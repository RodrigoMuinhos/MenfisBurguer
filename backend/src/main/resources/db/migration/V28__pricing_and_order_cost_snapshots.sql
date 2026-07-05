create table if not exists pricing_products (
  id text primary key,
  code text not null,
  name text not null,
  category text not null,
  kind text not null,
  base_cost numeric(12,2) not null default 0,
  fries_cost numeric(12,2) not null default 0,
  default_drink_cost numeric(12,2) not null default 0,
  alternative_drink_cost numeric(12,2) not null default 0,
  drink_surcharge numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  target_cmv numeric(7,4) not null default 0.35,
  active boolean not null default true,
  notes text,
  test_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pricing_products_test_mode_kind
  on pricing_products(test_mode, kind, active);

create table if not exists order_cost_snapshots (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders(id) on delete cascade,
  order_item_id uuid references order_items(id) on delete cascade,
  product_id text,
  product_name text not null,
  quantity integer not null default 1,
  sale_price_snapshot numeric(12,2) not null default 0,
  cost_snapshot numeric(12,2) not null default 0,
  gross_profit_snapshot numeric(12,2) not null default 0,
  cmv_snapshot numeric(7,4) not null default 0,
  margin_snapshot numeric(7,4) not null default 0,
  test_mode boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_cost_snapshots_order
  on order_cost_snapshots(order_id);

create index if not exists idx_order_cost_snapshots_product
  on order_cost_snapshots(test_mode, product_id);

insert into pricing_products (
  id, code, name, category, kind, base_cost, fries_cost, default_drink_cost,
  alternative_drink_cost, drink_surcharge, sale_price, target_cmv, active, test_mode
)
values
  ('burger', 'MENFIS', 'Menfi''s Burguer', 'Sanduiche', 'sandwich', 7.50, 0, 0, 0, 0, 21.90, 0.35, true, false),
  ('double-burger', 'BIG-MENFIS', 'Big Menfi''s Burguer', 'Sanduiche', 'sandwich', 12.00, 0, 0, 0, 0, 34.90, 0.35, true, false),
  ('menfis-chicken', 'CHICKEN', 'Menfi''s Chicken', 'Sanduiche', 'sandwich', 6.30, 0, 0, 0, 0, 19.90, 0.35, true, false),
  ('double-menfis-chicken', 'BIG-CHICKEN', 'Big Chicken', 'Sanduiche', 'sandwich', 9.80, 0, 0, 0, 0, 29.90, 0.35, true, false),
  ('menfis-bacon', 'BACON', 'Menfi''s Bacon', 'Sanduiche', 'sandwich', 9.80, 0, 0, 0, 0, 29.90, 0.35, true, false),
  ('double-menfis-bacon', 'BIG-BACON', 'Big Menfi''s Bacon', 'Sanduiche', 'sandwich', 14.70, 0, 0, 0, 0, 42.90, 0.35, true, false),
  ('batata', 'BATATA', 'Batata', 'Acompanhamento', 'side', 3.70, 0, 0, 0, 0, 12.90, 0.35, true, false),
  ('guarana-zero', 'GUARANA', 'Guarana Zero', 'Bebida', 'drink', 2.89, 0, 0, 0, 0, 6.90, 0.35, true, false),
  ('coca-zero', 'COCA', 'Coca-Cola Zero', 'Bebida', 'drink', 3.89, 0, 0, 0, 2.00, 8.90, 0.35, true, false),
  ('combo', 'COMBO-MENFIS', 'Combo Menfi''s', 'Combo', 'combo', 7.50, 3.70, 2.89, 3.89, 2.00, 39.90, 0.35, true, false),
  ('double-combo', 'COMBO-BIG', 'Combo Big Menfi''s', 'Combo', 'combo', 12.00, 3.70, 2.89, 3.89, 2.00, 52.90, 0.35, true, false),
  ('chicken-combo', 'COMBO-CHICKEN', 'Combo Chicken', 'Combo', 'combo', 6.30, 3.70, 2.89, 3.89, 2.00, 36.90, 0.35, true, false),
  ('double-chicken-combo', 'COMBO-BIG-CHICKEN', 'Combo Big Chicken', 'Combo', 'combo', 9.80, 3.70, 2.89, 3.89, 2.00, 46.90, 0.35, true, false),
  ('bacon-combo', 'COMBO-BACON', 'Combo Bacon', 'Combo', 'combo', 9.80, 3.70, 2.89, 3.89, 2.00, 46.90, 0.35, true, false),
  ('double-bacon-combo', 'COMBO-BIG-BACON', 'Combo Big Bacon', 'Combo', 'combo', 14.70, 3.70, 2.89, 3.89, 2.00, 59.90, 0.35, true, false)
on conflict (id) do nothing;
