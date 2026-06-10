alter table customers add column if not exists internal_notes text;

create table if not exists customer_password_recovery_codes (
  id bigserial primary key,
  customer_id bigint not null references customers(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_password_recovery_customer
  on customer_password_recovery_codes(customer_id, expires_at desc);
