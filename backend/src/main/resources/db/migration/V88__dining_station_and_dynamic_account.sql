alter table table_kits add column if not exists installed_by_staff text;

create index if not exists idx_orders_dining_open_account
  on orders(dining_session_id, status)
  where channel = 'DINING_QR' and status in ('CREATED', 'PAYMENT_REQUESTED');
