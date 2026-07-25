insert into inventory_items (
  id, name, unit, category, quantity, min_quantity, unit_cost,
  entry_date, active, updated_at
)
values
  ('cebola-roxa', 'Cebola roxa', 'g', 'Hortifruti', 0, 1000, 0.0120, current_date, true, now()),
  ('tomate-cereja', 'Tomate-cereja', 'g', 'Hortifruti', 0, 1000, 0.0250, current_date, true, now()),
  ('manga', 'Manga', 'g', 'Hortifruti', 0, 1000, 0.0180, current_date, true, now()),
  ('alho-frito', 'Alho frito', 'g', 'Complementos', 0, 500, 0.0500, current_date, true, now()),
  ('molho-caesar', 'Molho Caesar', 'g', 'Molhos', 0, 1000, 0.0350, current_date, true, now()),
  ('pepino', 'Pepino', 'g', 'Hortifruti', 0, 1000, 0.0120, current_date, true, now())
on conflict (id) do update set
  name = excluded.name,
  unit = excluded.unit,
  category = excluded.category,
  unit_cost = excluded.unit_cost,
  active = true,
  updated_at = now();

insert into products (
  id, name, description, base_price, active, image_url, updated_at
)
values (
  'chicken-menfis-salad',
  'Chicken Menfi''s Salad',
  'Frango grelhado 120g, cebola roxa, alface, tomate-cereja, manga, alho frito, molho Caesar e pepino.',
  39.90,
  true,
  '/menu/chicken-menfis-salad.png',
  now()
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  base_price = excluded.base_price,
  active = true,
  image_url = excluded.image_url,
  updated_at = now();

delete from product_ingredients
where product_id = 'chicken-menfis-salad';

insert into product_ingredients (product_id, inventory_item_id, quantity)
values
  ('chicken-menfis-salad', 'file-frango', 1),
  ('chicken-menfis-salad', 'alface', 0.5),
  ('chicken-menfis-salad', 'cebola-roxa', 30),
  ('chicken-menfis-salad', 'tomate-cereja', 60),
  ('chicken-menfis-salad', 'manga', 70),
  ('chicken-menfis-salad', 'alho-frito', 10),
  ('chicken-menfis-salad', 'molho-caesar', 35),
  ('chicken-menfis-salad', 'pepino', 50);

insert into pricing_products (
  id, code, name, category, kind, base_cost, fries_cost, default_drink_cost,
  alternative_drink_cost, drink_surcharge, sale_price, target_cmv, active,
  notes, test_mode, image_url, original_price, updated_at
)
values (
  'chicken-menfis-salad',
  'SALAD-CHICKEN',
  'Chicken Menfi''s Salad',
  'Salad',
  'side',
  13.80,
  0,
  0,
  0,
  0,
  39.90,
  0.35,
  true,
  'Frango grelhado 120g, cebola roxa, alface, tomate-cereja, manga, alho frito, molho Caesar e pepino.',
  false,
  '/menu/chicken-menfis-salad.png',
  null,
  now()
)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  category = excluded.category,
  kind = excluded.kind,
  base_cost = excluded.base_cost,
  sale_price = excluded.sale_price,
  target_cmv = excluded.target_cmv,
  active = true,
  notes = excluded.notes,
  image_url = excluded.image_url,
  updated_at = now();
