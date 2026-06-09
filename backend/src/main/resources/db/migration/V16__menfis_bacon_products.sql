insert into products (id, name, description, base_price, active, image_url)
values
  (
    'menfis-bacon',
    'Menfi''s Bacon',
    'Menfi''s Burger com bacon crocante',
    27.90,
    true,
    '/MENFISBACON.jpg'
  ),
  (
    'double-menfis-bacon',
    'Double Menfi''s Bacon',
    'Double Menfi''s com bacon crocante',
    35.90,
    true,
    '/MENFISBACON.jpg'
  ),
  (
    'bacon-combo',
    'Combo Menfi''s Bacon',
    'Menfi''s Bacon, batata frita e bebida',
    40.90,
    true,
    '/MENFISBACON.jpg'
  ),
  (
    'double-bacon-combo',
    'Combo Double Menfi''s Bacon',
    'Double Menfi''s Bacon, batata frita e bebida',
    48.90,
    true,
    '/MENFISBACON.jpg'
  ),
  (
    'bacon-super-combo',
    'Super Combo Menfi''s Bacon',
    'Dois Menfi''s Bacon, duas bebidas e batata frita',
    71.90,
    true,
    '/MENFISBACON.jpg'
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  base_price = excluded.base_price,
  active = excluded.active,
  image_url = excluded.image_url;

insert into inventory_items (id, name, unit, quantity, min_quantity)
values ('bacon', 'Bacon', 'g', 400, 160)
on conflict (id) do update set name = excluded.name, unit = excluded.unit, min_quantity = excluded.min_quantity;

insert into product_ingredients (product_id, inventory_item_id, quantity)
select product_id, inventory_item_id, quantity
from (
  values
    ('menfis-bacon', 'pao-brioche', 1),
    ('menfis-bacon', 'carne-70-30', 0.1),
    ('menfis-bacon', 'queijo', 1),
    ('menfis-bacon', 'alface', 0.5),
    ('menfis-bacon', 'molho', 30),
    ('menfis-bacon', 'bacon', 40),
    ('double-menfis-bacon', 'pao-brioche', 1),
    ('double-menfis-bacon', 'carne-70-30', 0.2),
    ('double-menfis-bacon', 'queijo', 2),
    ('double-menfis-bacon', 'alface', 0.5),
    ('double-menfis-bacon', 'molho', 40),
    ('double-menfis-bacon', 'bacon', 80),
    ('bacon-combo', 'pao-brioche', 1),
    ('bacon-combo', 'carne-70-30', 0.1),
    ('bacon-combo', 'queijo', 1),
    ('bacon-combo', 'alface', 0.5),
    ('bacon-combo', 'molho', 30),
    ('bacon-combo', 'bacon', 40),
    ('bacon-combo', 'batata', 0.25),
    ('bacon-combo', 'coca-cola', 1),
    ('double-bacon-combo', 'pao-brioche', 1),
    ('double-bacon-combo', 'carne-70-30', 0.2),
    ('double-bacon-combo', 'queijo', 2),
    ('double-bacon-combo', 'alface', 0.5),
    ('double-bacon-combo', 'molho', 40),
    ('double-bacon-combo', 'bacon', 80),
    ('double-bacon-combo', 'batata', 0.25),
    ('double-bacon-combo', 'coca-cola', 1),
    ('bacon-super-combo', 'pao-brioche', 2),
    ('bacon-super-combo', 'carne-70-30', 0.2),
    ('bacon-super-combo', 'queijo', 2),
    ('bacon-super-combo', 'alface', 1),
    ('bacon-super-combo', 'molho', 60),
    ('bacon-super-combo', 'bacon', 80),
    ('bacon-super-combo', 'batata', 0.25),
    ('bacon-super-combo', 'coca-cola', 2)
) as seed(product_id, inventory_item_id, quantity)
where not exists (
  select 1 from product_ingredients pi
  where pi.product_id = seed.product_id and pi.inventory_item_id = seed.inventory_item_id
);
