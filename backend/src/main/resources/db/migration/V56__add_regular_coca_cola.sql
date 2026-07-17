insert into products (id, name, description, base_price, active, image_url, updated_at)
values (
  'coca-cola',
  'Coca-Cola',
  'Coca-Cola tradicional gelada',
  8.90,
  true,
  '/EXTRAS/cocacola.png',
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
  'coca-cola', 'COCA-TRADICIONAL', 'Coca-Cola', 'Bebida', 'drink',
  3.89, 0, 0, 0, 0, 8.90, 0.35, true, false,
  '/EXTRAS/cocacola.png', null, now()
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

insert into inventory_items (id, name, unit, quantity, min_quantity)
values ('coca-cola', 'Coca-Cola', 'un', 0, 12)
on conflict (id) do update set
  name = excluded.name,
  unit = excluded.unit,
  min_quantity = excluded.min_quantity;

insert into product_ingredients (product_id, inventory_item_id, quantity)
select 'coca-cola', 'coca-cola', 1
where not exists (
  select 1
  from product_ingredients
  where product_id = 'coca-cola'
    and inventory_item_id = 'coca-cola'
);
