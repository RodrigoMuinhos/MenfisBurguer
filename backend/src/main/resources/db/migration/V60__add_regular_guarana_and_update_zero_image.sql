update products
set image_url = '/EXTRAS/Gurarana%20zero.jpg',
    updated_at = now()
where id = 'guarana-zero';

update pricing_products
set image_url = '/EXTRAS/Gurarana%20zero.jpg',
    updated_at = now()
where id = 'guarana-zero';

insert into products (id, name, description, base_price, active, image_url, updated_at)
values (
  'guarana',
  'Guaraná',
  'Guaraná tradicional gelado',
  6.90,
  true,
  '/EXTRAS/Gurarana.jpg',
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
  'guarana', 'GUARANA-TRADICIONAL', 'Guaraná', 'Bebida', 'drink',
  2.89, 0, 0, 0, 0, 6.90, 0.35, true, false,
  '/EXTRAS/Gurarana.jpg', null, now()
)
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

insert into inventory_items (id, name, unit, quantity, min_quantity)
values ('guarana', 'Guaraná', 'un', 0, 12)
on conflict (id) do update set
  name = excluded.name,
  unit = excluded.unit,
  min_quantity = excluded.min_quantity;

insert into product_ingredients (product_id, inventory_item_id, quantity)
select 'guarana', 'guarana', 1
where not exists (
  select 1
  from product_ingredients
  where product_id = 'guarana'
    and inventory_item_id = 'guarana'
);
