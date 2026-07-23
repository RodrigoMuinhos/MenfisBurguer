insert into addons (id, name, price, active)
values
  ('topping-chantilly', 'Chantilly', 3.00, true),
  ('topping-espuma-ginger', 'Espuma Ginger', 3.00, true)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  active = true;
