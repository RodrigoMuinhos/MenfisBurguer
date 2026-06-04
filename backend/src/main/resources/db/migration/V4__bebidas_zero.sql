insert into products (id, name, description, base_price, active)
values
  ('coca-zero', 'Coca-Cola Zero', 'Refrigerante zero lata', 8.90, true),
  ('guarana-zero', 'Guaraná Zero', 'Refrigerante zero lata', 8.90, true),
  ('agua-com-gas', 'Água com gás', 'Água com gás gelada', 5.90, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  base_price = excluded.base_price,
  active = excluded.active;

insert into inventory_items (id, name, unit, quantity, min_quantity)
values
  ('coca-zero', 'Coca-Cola Zero', 'un', 60, 12),
  ('guarana-zero', 'Guaraná Zero', 'un', 60, 12),
  ('agua-com-gas', 'Água com gás', 'un', 60, 12)
on conflict (id) do update set
  name = excluded.name,
  unit = excluded.unit,
  min_quantity = excluded.min_quantity;

insert into product_ingredients (product_id, inventory_item_id, quantity)
select product_id, inventory_item_id, quantity
from (
  values
    ('coca-zero', 'coca-zero', 1),
    ('guarana-zero', 'guarana-zero', 1),
    ('agua-com-gas', 'agua-com-gas', 1)
) as seed(product_id, inventory_item_id, quantity)
where not exists (
  select 1 from product_ingredients pi
  where pi.product_id = seed.product_id
    and pi.inventory_item_id = seed.inventory_item_id
);
