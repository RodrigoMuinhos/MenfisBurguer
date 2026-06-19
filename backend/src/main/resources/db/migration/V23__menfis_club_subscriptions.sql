create table if not exists customer_club_subscriptions (
  id uuid primary key,
  customer_id bigint not null references customers(id),
  plan text not null,
  status text not null default 'pending',
  payment_status text not null default 'pending',
  provider_preference_id text,
  provider_payment_id text,
  started_at timestamptz,
  expires_at timestamptz,
  free_shipping_total integer not null default 0,
  free_shipping_used integer not null default 0,
  discount_total integer not null default 0,
  discount_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table customers add column if not exists club_level text;
alter table customers add column if not exists club_expires_at timestamptz;
alter table customers add column if not exists club_subscription_id uuid;

create index if not exists idx_customer_club_customer_status on customer_club_subscriptions(customer_id, status);
create index if not exists idx_customer_club_payment on customer_club_subscriptions(provider_payment_id);
