insert into inventory_items (
  id, name, unit, category, quantity, min_quantity, unit_cost,
  entry_date, active, updated_at
)
values (
  'cenoura', 'Cenoura', 'g', 'Hortifruti', 0, 1000, 0.0080,
  current_date, true, now()
)
on conflict (id) do update set
  name = excluded.name,
  unit = excluded.unit,
  category = excluded.category,
  active = true,
  updated_at = now();

update products
set description = 'Frango grelhado 120g, cebola roxa, alface, alho frito, molho Caesar e cenoura ralada.',
    updated_at = now()
where id = 'chicken-menfis-salad';

update pricing_products
set notes = 'Frango grelhado 120g, cebola roxa, alface, alho frito, molho Caesar e cenoura ralada.',
    updated_at = now()
where id = 'chicken-menfis-salad';

delete from product_ingredients
where product_id = 'chicken-menfis-salad';

insert into product_ingredients (product_id, inventory_item_id, quantity)
values
  ('chicken-menfis-salad', 'file-frango', 1),
  ('chicken-menfis-salad', 'alface', 0.5),
  ('chicken-menfis-salad', 'cebola-roxa', 30),
  ('chicken-menfis-salad', 'alho-frito', 10),
  ('chicken-menfis-salad', 'molho-caesar', 35),
  ('chicken-menfis-salad', 'cenoura', 50);

insert into addons (id, name, price, active)
values
  ('salad-coca-zero', 'Coca-Cola Zero', 4.00, true),
  ('salad-guarana-zero', 'Guaraná Zero', 2.00, true),
  ('salad-agua-com-gas', 'Água com gás', 4.00, true)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  active = true;
