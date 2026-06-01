import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

let pool: Pool | undefined;

function normalizeDatabaseUrl(url: string) {
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

function getPool() {
  if (pool) return pool;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");

  pool = new Pool({
    connectionString: normalizeDatabaseUrl(databaseUrl),
    ssl: { rejectUnauthorized: false },
  });
  return pool;
}

async function ensureSchema() {
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

export async function POST(request: Request) {
  const body = await request.json();
  const cpf = String(body.cpf ?? "").replace(/\D/g, "");
  const phone = String(body.phone ?? "").replace(/\D/g, "");

  if (cpf.length !== 11 && phone.length < 10) {
    return NextResponse.json({ error: "cpf_or_phone_required" }, { status: 400 });
  }

  await ensureSchema();

  const result = await getPool().query(
    `
      insert into customers (cpf, phone, cep, street, house_number, complement, updated_at)
      values ($1, $2, $3, $4, $5, $6, now())
      on conflict (cpf) do update set
        phone = excluded.phone,
        cep = excluded.cep,
        street = excluded.street,
        house_number = excluded.house_number,
        complement = excluded.complement,
        updated_at = now()
      returning id, updated_at
    `,
    [
      cpf.length === 11 ? cpf : null,
      phone || null,
      String(body.cep ?? ""),
      String(body.street ?? ""),
      String(body.number ?? ""),
      String(body.complement ?? ""),
    ]
  );

  return NextResponse.json({ ok: true, customer: result.rows[0] });
}
