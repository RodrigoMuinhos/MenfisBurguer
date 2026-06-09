alter table orders add column if not exists test_mode boolean not null default false;
alter table stock_movements add column if not exists test_mode boolean not null default false;
alter table coupons add column if not exists test_mode boolean not null default false;

alter table inventory_items add column if not exists test_quantity numeric(12,3) not null default 0;
alter table inventory_items add column if not exists test_min_quantity numeric(12,3) not null default 0;
alter table inventory_items add column if not exists test_unit_cost numeric(12,4) not null default 0;
alter table inventory_items add column if not exists test_entry_date date;
alter table inventory_items add column if not exists test_expires_at date;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_name = 'coupons'
      and constraint_name = 'coupons_pkey'
  ) then
    alter table coupons drop constraint coupons_pkey;
  end if;
end $$;

alter table coupons add primary key (code, test_mode);

insert into app_settings(key, value, updated_at)
values ('test_mode_enabled', 'false', now())
on conflict (key) do nothing;

delete from support_tickets;
delete from stock_movements where order_id is not null;
delete from orders;
delete from coupons;

alter sequence order_number_seq restart with 1001;

update inventory_items
set quantity = 0,
    min_quantity = 0,
    unit_cost = 0,
    entry_date = null,
    expires_at = null,
    test_quantity = 0,
    test_min_quantity = 0,
    test_unit_cost = 0,
    test_entry_date = null,
    test_expires_at = null,
    updated_at = now();

create index if not exists idx_orders_test_mode_created on orders(test_mode, created_at desc);
create index if not exists idx_orders_test_mode_status on orders(test_mode, status);
