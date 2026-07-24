insert into addons (id, name, price, active)
values ('adicional-vodka', 'Adicional de Vodka', 6.50, true)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  active = true;
