alter table inventory_items add column if not exists unit_cost numeric(12,4) not null default 0;
alter table inventory_items add column if not exists entry_date date;

update inventory_items
set unit_cost = case id
  when 'pao-brioche' then 1.80
  when 'carne-70-30' then 28.00
  when 'alface' then 2.50
  when 'queijo' then 4.50
  when 'coca-cola' then 3.20
  when 'batata' then 8.00
  when 'molho' then 0.02
  when 'file-frango' then 6.50
  when 'bacon' then 0.0435
  else unit_cost
end
where unit_cost = 0;

update inventory_items
set entry_date = coalesce(entry_date, current_date)
where entry_date is null;

create table if not exists coupons (
  code text primary key,
  label text not null,
  type text not null,
  value numeric(12,2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into coupons (code, label, type, value, active)
values
  ('Chicken1790', 'Menfi''s Chicken por R$ 17,90', 'fixed_total', 17.90, true),
  ('mob10', '10% de desconto', 'percent', 10.00, true),
  ('marianazinha', 'Pedido por R$ 1,00 para testar Mercado Pago', 'fixed_total', 1.00, true)
on conflict (code) do update set
  label = excluded.label,
  type = excluded.type,
  value = excluded.value,
  updated_at = now();
