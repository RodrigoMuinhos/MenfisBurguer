insert into products (id, name, description, base_price, active, image_url)
values
  (
    'double-menfis-chicken',
    'Double Menfi''s Chicken',
    'Dois filés de frango empanado crocante, queijo, alface e molho especial',
    32.90,
    true,
    '/MenfisChicken.jpg'
  ),
  (
    'double-chicken-combo',
    'Double Combo Menfi''s Chicken',
    'Double Menfi''s Chicken, batata frita e bebida',
    46.90,
    true,
    '/MenfisChicken.jpg'
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  base_price = excluded.base_price,
  active = excluded.active,
  image_url = excluded.image_url;

update products
set name = case id
  when 'menfis-chicken' then 'Menfi''s Chicken'
  when 'chicken-combo' then 'Combo Menfi''s Chicken'
  when 'chicken-super-combo' then 'Super Combo Menfi''s Chicken'
  else name
end,
description = replace(description, 'Menfis Chicken', 'Menfi''s Chicken')
where id in ('menfis-chicken', 'chicken-combo', 'chicken-super-combo');

insert into product_ingredients (product_id, inventory_item_id, quantity)
select product_id, inventory_item_id, quantity
from (
  values
    ('double-menfis-chicken', 'pao-brioche', 1),
    ('double-menfis-chicken', 'file-frango', 2),
    ('double-menfis-chicken', 'queijo', 2),
    ('double-menfis-chicken', 'alface', 0.5),
    ('double-menfis-chicken', 'molho', 40),
    ('double-chicken-combo', 'pao-brioche', 1),
    ('double-chicken-combo', 'file-frango', 2),
    ('double-chicken-combo', 'queijo', 2),
    ('double-chicken-combo', 'alface', 0.5),
    ('double-chicken-combo', 'molho', 40),
    ('double-chicken-combo', 'batata', 0.25),
    ('double-chicken-combo', 'coca-cola', 1)
) as seed(product_id, inventory_item_id, quantity)
where not exists (
  select 1 from product_ingredients pi
  where pi.product_id = seed.product_id and pi.inventory_item_id = seed.inventory_item_id
);
