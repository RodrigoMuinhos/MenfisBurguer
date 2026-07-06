alter table inventory_items add column if not exists category text not null default 'Geral';
alter table inventory_items add column if not exists monthly_base_stock numeric(12,3) not null default 0;
alter table inventory_items add column if not exists test_monthly_base_stock numeric(12,3) not null default 0;

update inventory_items
set monthly_base_stock = quantity
where monthly_base_stock = 0 and quantity > 0;

create table if not exists stock_months (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'OPEN',
  test_mode boolean not null default false,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists stock_month_snapshots (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references stock_months(id) on delete cascade,
  inventory_item_id text not null references inventory_items(id),
  initial_stock numeric(12,3) not null default 0,
  total_entries numeric(12,3) not null default 0,
  total_sales_output numeric(12,3) not null default 0,
  total_manual_output numeric(12,3) not null default 0,
  final_stock numeric(12,3) not null default 0,
  final_cost numeric(12,2) not null default 0
);

create index if not exists idx_stock_months_mode_status on stock_months(test_mode, status, start_date desc);
create index if not exists idx_stock_snapshots_month on stock_month_snapshots(month_id);
