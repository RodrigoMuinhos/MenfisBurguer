alter table customers add column if not exists name text;
alter table customers add column if not exists email text;
alter table customers add column if not exists birthday date;
alter table customers add column if not exists birth_year integer;
alter table customers add column if not exists phone_digits text;
alter table customers add column if not exists avatar_url text;
alter table customers add column if not exists last_login_at timestamptz;

update customers
set phone_digits = regexp_replace(coalesce(phone, ''), '\D', '', 'g')
where phone_digits is null;

create index if not exists customers_phone_digits_idx
  on customers (phone_digits)
  where phone_digits is not null and phone_digits <> '';

create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id bigint references customers(id),
  cep text not null default '',
  street text not null default '',
  house_number text not null default '',
  complement text,
  neighborhood text,
  city text,
  state text,
  created_at timestamptz not null default now()
);

alter table addresses add column if not exists label text not null default 'Principal';
alter table addresses add column if not exists reference text;
alter table addresses add column if not exists is_default boolean not null default false;

alter table orders add column if not exists customer_id bigint references customers(id);

create index if not exists idx_orders_customer_phone on orders(customer_phone);
create index if not exists idx_orders_customer_id on orders(customer_id);
