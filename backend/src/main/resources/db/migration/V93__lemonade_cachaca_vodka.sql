insert into addons (id, name, price, active)
values
  ('adicional-cachaca', 'Cachaça', 3.00, true),
  ('adicional-vodka', 'Vodka', 3.00, true)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  active = true;

update addons
set active = false
where id in ('topping-chantilly', 'topping-espuma-ginger');
