insert into addons (id, name, price, active)
values
  ('salad-pink-lemonade', 'Pink Lemonade', 14.90, true),
  ('salad-purple-lemonade', 'Purple Lemonade', 14.90, true),
  ('salad-sunset-lemonade', 'Sunset Lemonade', 14.90, true)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  active = true;
