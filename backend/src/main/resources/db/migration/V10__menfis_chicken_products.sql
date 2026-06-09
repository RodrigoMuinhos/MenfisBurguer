insert into products (id, name, description, base_price, active, image_url)
values
  ('menfis-chicken', 'Menfis Chicken', 'Filé de frango empanado crocante, queijo, alface e molho especial', 24.90, true, '/MenfisChicken.jpg'),
  ('chicken-combo', 'Combo Menfis Chicken', 'Menfis Chicken, batata frita e bebida', 38.90, true, '/MenfisChicken.jpg'),
  ('chicken-super-combo', 'Super Combo Chicken', 'Dois Menfis Chicken, duas bebidas e batata frita', 64.90, true, '/MenfisChicken.jpg')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  base_price = excluded.base_price,
  active = excluded.active,
  image_url = excluded.image_url;

insert into inventory_items (id, name, unit, quantity, min_quantity)
values ('file-frango', 'Filé de frango empanado', 'un', 80, 15)
on conflict (id) do update set name = excluded.name, unit = excluded.unit, min_quantity = excluded.min_quantity;

insert into product_ingredients (product_id, inventory_item_id, quantity)
select product_id, inventory_item_id, quantity
from (
  values
    ('menfis-chicken', 'pao-brioche', 1),
    ('menfis-chicken', 'file-frango', 1),
    ('menfis-chicken', 'queijo', 1),
    ('menfis-chicken', 'alface', 0.5),
    ('menfis-chicken', 'molho', 30),
    ('chicken-combo', 'pao-brioche', 1),
    ('chicken-combo', 'file-frango', 1),
    ('chicken-combo', 'queijo', 1),
    ('chicken-combo', 'alface', 0.5),
    ('chicken-combo', 'molho', 30),
    ('chicken-combo', 'batata', 0.25),
    ('chicken-combo', 'coca-cola', 1),
    ('chicken-super-combo', 'pao-brioche', 2),
    ('chicken-super-combo', 'file-frango', 2),
    ('chicken-super-combo', 'queijo', 2),
    ('chicken-super-combo', 'alface', 1),
    ('chicken-super-combo', 'molho', 60),
    ('chicken-super-combo', 'batata', 0.25),
    ('chicken-super-combo', 'coca-cola', 2)
) as seed(product_id, inventory_item_id, quantity)
where not exists (
  select 1 from product_ingredients pi
  where pi.product_id = seed.product_id and pi.inventory_item_id = seed.inventory_item_id
);
