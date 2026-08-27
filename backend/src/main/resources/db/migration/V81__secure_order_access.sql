alter table orders add column if not exists tracking_token_hash text;
alter table orders add column if not exists delivery_code text;

create unique index if not exists ux_orders_tracking_token_hash
  on orders(tracking_token_hash)
  where tracking_token_hash is not null;

update orders
set delivery_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
where delivery_code is null;

alter table orders alter column delivery_code set not null;
