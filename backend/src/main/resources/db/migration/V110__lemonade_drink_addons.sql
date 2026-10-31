-- Lemonades offer only two drink upgrades: vodka or aguardente, R$ 4,50 each.
insert into addons (id, name, price, active)
values
  ('adicional-vodka', 'Drink com vodka', 4.50, true),
  ('adicional-cachaca', 'Drink com aguardente', 4.50, true)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  active = true;
