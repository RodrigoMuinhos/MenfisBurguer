insert into inventory_items (
  id, name, unit, category, quantity, min_quantity, unit_cost,
  monthly_base_stock, active, updated_at
)
values
  ('nuggets', 'Menfi''s Nuggets', 'kg', 'Galeria de Fritas', 0, 2, 31.2857, 0, true, now())
on conflict (id) do update set
  name = excluded.name,
  unit = excluded.unit,
  category = excluded.category,
  min_quantity = excluded.min_quantity,
  unit_cost = excluded.unit_cost,
  active = true,
  updated_at = now();

with menu(id, name, description, sale_price, image_url) as (
  values
    ('batata-pequena', 'Batata Frita Pequena', 'Porção pequena de batata frita 100g.', 9.90, '/EXTRAS/batata.jpg'),
    ('batata-media', 'Batata Frita Média', 'Porção média de batata frita 180g.', 14.90, '/EXTRAS/batata.jpg'),
    ('nuggets-100g', 'Menfi''s Nuggets 100g', 'Porção pequena de nuggets crocantes 100g.', 12.90, '/nugget.jpeg'),
    ('nuggets-10un', 'Menfi''s Nuggets 10 unidades', 'Porção média de nuggets crocantes com 10 unidades.', 18.90, '/nugget.jpeg'),
    ('nuggets-grande', 'Menfi''s Nuggets Grande', 'Porção grande de nuggets crocantes para compartilhar.', 29.90, '/nugget.jpeg')
)
insert into products (id, name, description, base_price, active, image_url, updated_at)
select id, name, description, sale_price, true, image_url, now()
from menu
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
values
  ('batata-pequena', 'BATATA-P', 'Batata Frita Pequena', 'Galeria de Fritas', 'side', 1.48, 0, 0, 0, 0, 9.90, 0.35, true, false, '/EXTRAS/batata.jpg', null, now()),
  ('batata-media', 'BATATA-M', 'Batata Frita Média', 'Galeria de Fritas', 'side', 2.66, 0, 0, 0, 0, 14.90, 0.35, true, false, '/EXTRAS/batata.jpg', null, now()),
  ('nuggets-100g', 'NUGGETS-100G', 'Menfi''s Nuggets 100g', 'Galeria de Fritas', 'side', 3.13, 0, 0, 0, 0, 12.90, 0.35, true, false, '/nugget.jpeg', null, now()),
  ('nuggets-10un', 'NUGGETS-10UN', 'Menfi''s Nuggets 10 unidades', 'Galeria de Fritas', 'side', 6.26, 0, 0, 0, 0, 18.90, 0.35, true, false, '/nugget.jpeg', null, now()),
  ('nuggets-grande', 'NUGGETS-G', 'Menfi''s Nuggets Grande', 'Galeria de Fritas', 'side', 9.39, 0, 0, 0, 0, 29.90, 0.35, true, false, '/nugget.jpeg', null, now())
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  category = excluded.category,
  kind = excluded.kind,
  base_cost = excluded.base_cost,
  sale_price = excluded.sale_price,
  target_cmv = excluded.target_cmv,
  active = true,
  image_url = excluded.image_url,
  updated_at = now();

insert into product_ingredients (product_id, inventory_item_id, quantity)
select product_id, inventory_item_id, quantity
from (
  values
    ('batata-pequena', 'batata', 0.10),
    ('batata-media', 'batata', 0.18),
    ('nuggets-100g', 'nuggets', 0.10),
    ('nuggets-10un', 'nuggets', 0.20),
    ('nuggets-grande', 'nuggets', 0.30)
) as recipe(product_id, inventory_item_id, quantity)
where not exists (
  select 1
  from product_ingredients pi
  where pi.product_id = recipe.product_id
    and pi.inventory_item_id = recipe.inventory_item_id
);
