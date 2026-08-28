alter table inventory_items
  add column if not exists package_quantity numeric(12,3),
  add column if not exists package_cost numeric(12,2);

-- Alface era controlada por unidade. Uma unidade operacional equivale a 200 g,
-- preservando saldo, mínimo e valor total durante a conversão.
update inventory_items
set quantity = quantity * 200,
    min_quantity = min_quantity * 200,
    monthly_base_stock = monthly_base_stock * 200,
    test_quantity = test_quantity * 200,
    test_min_quantity = test_min_quantity * 200,
    test_monthly_base_stock = test_monthly_base_stock * 200,
    unit_cost = unit_cost / 200,
    test_unit_cost = test_unit_cost / 200,
    unit = 'g',
    updated_at = now()
where id = 'alface' and unit <> 'g';

update product_ingredients
set quantity = quantity * 200
where inventory_item_id = 'alface' and quantity < 10;

insert into inventory_items (
  id, name, unit, category, quantity, min_quantity, unit_cost,
  package_quantity, package_cost, entry_date, active, updated_at
)
values
  ('molho-caesar', 'Molho Caesar', 'ml', 'Molhos', 0, 400, 0.04475, 400, 17.90, current_date, true, now()),
  ('alho-frito', 'Alho frito', 'g', 'Secos', 0, 200, 0.04500, 200, 9.00, current_date, true, now())
on conflict (id) do update set
  name = excluded.name,
  unit = excluded.unit,
  category = excluded.category,
  unit_cost = excluded.unit_cost,
  package_quantity = excluded.package_quantity,
  package_cost = excluded.package_cost,
  active = true,
  updated_at = now();

insert into products (id, name, description, base_price, active, updated_at)
values
  ('salad-protein-frango', 'Proteína frango 150g', 'Proteína da Menfi''s Salad', 0, true, now()),
  ('salad-protein-carne', 'Proteína carne 150g', 'Proteína da Menfi''s Salad', 0, true, now())
on conflict (id) do update set name = excluded.name, description = excluded.description,
  base_price = 0, active = true, updated_at = now();

insert into addons (id, name, price, active)
values
  ('salad-protein-frango', 'Frango 150g', 0, true),
  ('salad-protein-carne', 'Carne 150g', 0, true)
on conflict (id) do update set name = excluded.name, price = 0, active = true;

delete from product_ingredients
where product_id in ('chicken-menfis-salad', 'salad-protein-frango', 'salad-protein-carne');

insert into product_ingredients (product_id, inventory_item_id, quantity)
values
  ('chicken-menfis-salad', 'alface', 100),
  ('chicken-menfis-salad', 'cebola-roxa', 30),
  ('chicken-menfis-salad', 'cenoura', 20),
  ('chicken-menfis-salad', 'alho-frito', 1),
  ('chicken-menfis-salad', 'molho-caesar', 15),
  ('salad-protein-frango', 'file-frango', 1),
  ('salad-protein-carne', 'carne-70-30', 0.150);

update products
set name = 'Menfi''s Salad',
    description = 'Escolha frango ou carne 150g, com alface 100g, cebola 30g, cenoura ralada 20g, alho frito e 15ml de molho Caesar.',
    updated_at = now()
where id = 'chicken-menfis-salad';

update pricing_products
set name = 'Menfi''s Salad',
    notes = 'Proteína 150g, alface 100g, cebola 30g, cenoura 20g, alho frito 1g e molho Caesar 15ml.',
    updated_at = now()
where id = 'chicken-menfis-salad';

update addons
set active = false
where id in ('salad-extra-tomate-cereja', 'salad-extra-manga', 'salad-extra-abacaxi', 'salad-extra-queijo');
