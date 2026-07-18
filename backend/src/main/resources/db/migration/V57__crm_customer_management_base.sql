alter table customers
  add column if not exists marketing_opt_in boolean not null default false;

alter table customers
  add column if not exists marketing_opt_in_at timestamptz;

update customers
set marketing_opt_in_at = coalesce(marketing_opt_in_at, updated_at, created_at)
where marketing_opt_in = true;

create index if not exists idx_customers_birthday
  on customers (birthday)
  where birthday is not null;

create index if not exists idx_customers_marketing_opt_in
  on customers (marketing_opt_in)
  where marketing_opt_in = true;
