update products
set active = false, updated_at = now()
where id in ('nuggets-100g', 'nuggets-10un');

update pricing_products
set active = false, updated_at = now()
where id in ('nuggets-100g', 'nuggets-10un');

with menu(id, name, description, sale_price, image_url, base_cost, code, stock_qty) as (
  values
    ('batata-pequena', 'Batata Frita Pequena', 'Porção pequena 90g de batata frita crocante para completar o lanche.', 9.90, '/EXTRAS/batata.jpg', 1.33, 'BATATA-P', 0.09),
    ('batata-media', 'Batata Frita Média', 'Porção média 180g de batata frita crocante para acompanhar o pedido.', 14.90, '/EXTRAS/batata.jpg', 2.66, 'BATATA-M', 0.18),
    ('batata', 'Batata Frita Grande', 'Porção grande 270g de batata frita crocante, finalizada quente para compartilhar.', 19.90, '/EXTRAS/batata.jpg', 4.00, 'BATATA-G', 0.27),
    ('nuggets-90g', 'Menfi''s Nuggets 90g', 'Porção pequena de nuggets crocantes 90g. Acompanha um molho e um ketchup.', 12.90, '/nuggetfries.jpg', 2.82, 'NUGGETS-90G', 0.09),
    ('nuggets-180g', 'Menfi''s Nuggets 180g', 'Porção média de nuggets crocantes 180g. Acompanha um molho e um ketchup.', 18.90, '/nuggetfries.jpg', 5.63, 'NUGGETS-180G', 0.18),
    ('nuggets-grande', 'Menfi''s Nuggets 270g', 'Porção grande de nuggets crocantes 270g. Acompanha um molho e um ketchup.', 29.90, '/nuggetfries.jpg', 8.45, 'NUGGETS-270G', 0.27)
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

with menu(id, name, sale_price, image_url, base_cost, code) as (
  values
    ('batata-pequena', 'Batata Frita Pequena', 9.90, '/EXTRAS/batata.jpg', 1.33, 'BATATA-P'),
    ('batata-media', 'Batata Frita Média', 14.90, '/EXTRAS/batata.jpg', 2.66, 'BATATA-M'),
    ('batata', 'Batata Frita Grande', 19.90, '/EXTRAS/batata.jpg', 4.00, 'BATATA-G'),
    ('nuggets-90g', 'Menfi''s Nuggets 90g', 12.90, '/nuggetfries.jpg', 2.82, 'NUGGETS-90G'),
    ('nuggets-180g', 'Menfi''s Nuggets 180g', 18.90, '/nuggetfries.jpg', 5.63, 'NUGGETS-180G'),
    ('nuggets-grande', 'Menfi''s Nuggets 270g', 29.90, '/nuggetfries.jpg', 8.45, 'NUGGETS-270G')
)
insert into pricing_products (
  id, code, name, category, kind, base_cost, fries_cost, default_drink_cost,
  alternative_drink_cost, drink_surcharge, sale_price, target_cmv, active,
  test_mode, image_url, original_price, updated_at
)
select id, code, name, 'Galeria de Fritas', 'side', base_cost, 0, 0, 0, 0, sale_price, 0.35, true, false, image_url, null, now()
from menu
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  category = excluded.category,
  kind = excluded.kind,
  base_cost = excluded.base_cost,
  sale_price = excluded.sale_price,
  active = true,
  image_url = excluded.image_url,
  updated_at = now();

delete from product_ingredients
where product_id in ('nuggets-100g', 'nuggets-10un');

delete from product_ingredients
where product_id in ('batata-pequena', 'batata-media', 'batata', 'nuggets-90g', 'nuggets-180g', 'nuggets-grande');

insert into product_ingredients (product_id, inventory_item_id, quantity)
values
  ('batata-pequena', 'batata', 0.09),
  ('batata-media', 'batata', 0.18),
  ('batata', 'batata', 0.27),
  ('nuggets-90g', 'nuggets', 0.09),
  ('nuggets-180g', 'nuggets', 0.18),
  ('nuggets-grande', 'nuggets', 0.27);
