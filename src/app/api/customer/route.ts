import { NextResponse } from "next/server";
import { ensureCustomersSchema, getPool } from "../_lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const cpf = String(body.cpf ?? "").replace(/\D/g, "");
  const phone = String(body.phone ?? "").replace(/\D/g, "");

  if (cpf.length !== 11 && phone.length < 10) {
    return NextResponse.json(
      { error: "cpf_or_phone_required" },
      { status: 400 },
    );
  }

  await ensureCustomersSchema();

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
    ],
  );

  return NextResponse.json({ ok: true, customer: result.rows[0] });
}
