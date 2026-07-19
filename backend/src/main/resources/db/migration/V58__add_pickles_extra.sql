insert into addons (id, name, price, active)
values ('extra-picles', 'Picles', 1.49, true)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  active = true;

insert into products (id, name, description, base_price, active, image_url, updated_at)
values (
  'extra-picles',
  'Picles',
  'Porção extra de picles',
  1.49,
  true,
  '/EXTRAS/picles.jpg',
  now()
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  base_price = excluded.base_price,
  active = true,
  image_url = excluded.image_url,
  updated_at = now();

insert into pricing_products (
  id, code, name, category, kind, base_cost, fries_cost, default_drink_cost,
  alternative_drink_cost, drink_surcharge, sale_price, target_cmv, active,
  test_mode, image_url, original_price, updated_at
)
values (
  'extra-picles', 'EXTRA-PICLES', 'Picles', 'Adicional', 'side',
  0, 0, 0, 0, 0, 1.49, 0.35, true, false,
  '/EXTRAS/picles.jpg', null, now()
)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  category = excluded.category,
  kind = excluded.kind,
  sale_price = excluded.sale_price,
  active = true,
  image_url = excluded.image_url,
  updated_at = now();
