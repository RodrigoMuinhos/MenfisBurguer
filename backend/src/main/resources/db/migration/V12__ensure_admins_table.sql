create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  login text not null unique,
  password_hash text not null,
  role text not null default 'ADMIN',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists admins_login_lower_unique
  on admins (lower(login));
