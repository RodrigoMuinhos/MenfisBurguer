insert into products (id, name, description, base_price, active)
values (
  'combo-coca-adicional',
  'Adicional Coca-Cola no combo',
  'Diferenca cobrada quando o cliente troca a bebida gratis do combo por Coca-Cola',
  2.00,
  true
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  base_price = excluded.base_price,
  active = true,
  updated_at = now();
