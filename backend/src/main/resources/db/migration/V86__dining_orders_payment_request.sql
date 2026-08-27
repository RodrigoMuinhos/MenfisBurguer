alter table orders add column if not exists public_id uuid not null default gen_random_uuid();
alter table orders add column if not exists payment_requested_at timestamptz;
alter table orders add column if not exists payment_confirmed_by_staff_id uuid references admins(id);

create unique index if not exists ux_orders_public_id on orders(public_id);
create index if not exists idx_orders_dining_public_id
  on orders(public_id) where channel = 'DINING_QR';

alter table orders add constraint ck_dining_payment_request_time
  check (channel <> 'DINING_QR' or status <> 'PAYMENT_REQUESTED' or payment_requested_at is not null);
