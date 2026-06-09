alter table customers add column if not exists password_hash text;

create index if not exists customers_email_lower_idx
  on customers (lower(email))
  where email is not null and email <> '';

create index if not exists customers_cpf_idx
  on customers (cpf)
  where cpf is not null and cpf <> '';
