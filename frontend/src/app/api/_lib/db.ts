import { Pool } from "pg";

let pool: Pool | undefined;

export function normalizeDatabaseUrl(url: string) {
  if (!url.startsWith("jdbc:postgresql://")) return url;
  const parsed = new URL(url.replace("jdbc:postgresql://", "postgresql://"));
  const user = parsed.searchParams.get("user");
  const password = parsed.searchParams.get("password");

  if (user) parsed.username = user;
  if (password) parsed.password = password;
  parsed.searchParams.delete("user");
  parsed.searchParams.delete("password");

  return parsed.toString();
}

export function getPool() {
  if (pool) return pool;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");

  pool = new Pool({
    connectionString: normalizeDatabaseUrl(databaseUrl),
    ssl: { rejectUnauthorized: false },
  });

  return pool;
}

export async function ensureCustomersSchema() {
  await getPool().query(`
    create table if not exists customers (
      id bigserial primary key,
      cpf text unique,
      phone text,
      cep text,
      street text,
      house_number text,
      complement text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
}

export async function ensureOrdersSchema() {
  await getPool().query(`
    create sequence if not exists order_number_seq start 1001;

    create table if not exists orders (
      id text primary key,
      number bigint not null unique,
      items jsonb not null,
      removed_by_item_id jsonb,
      channel text not null default 'DELIVERY',
      delivery_type text not null,
      customer_name text,
      customer_phone text,
      customer_address text,
      subtotal numeric(12,2),
      delivery_fee numeric(12,2) not null default 0,
      total numeric(12,2) not null,
      discount_total numeric(12,2) not null default 0,
      payment_provider text,
      payment_method text,
      payment_status text not null default 'not_required',
      payment_id text,
      timestamp bigint not null,
      status text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    alter table orders add column if not exists payment_provider text;
    alter table orders add column if not exists channel text not null default 'DELIVERY';
    alter table orders add column if not exists customer_name text;
    alter table orders add column if not exists subtotal numeric(12,2);
    alter table orders add column if not exists delivery_fee numeric(12,2) not null default 0;
    alter table orders add column if not exists discount_total numeric(12,2) not null default 0;
    alter table orders add column if not exists payment_method text;
    alter table orders add column if not exists payment_status text not null default 'not_required';
    alter table orders add column if not exists payment_id text;

    create index if not exists idx_orders_status on orders(status);
    create index if not exists idx_orders_number_desc on orders(number desc);
    create index if not exists idx_orders_payment_status on orders(payment_status);
  `);
}
