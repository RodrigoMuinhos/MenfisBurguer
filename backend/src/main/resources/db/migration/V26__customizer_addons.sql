insert into addons (id, name, price, active)
values
  ('extra-carne', 'Adicional de carne', 9.90, true),
  ('extra-frango', 'Adicional de frango', 9.90, true),
  ('extra-queijo', 'Extra queijo', 2.00, true),
  ('extra-ovo', 'Ovo', 2.50, true),
  ('extra-bacon', 'Adicional de bacon', 5.90, true),
  ('extra-cheddar', 'Adicional de cheddar', 6.90, true),
  ('extra-maionese-barbecue', 'Maionese Barbecue', 2.00, true),
  ('extra-maionese-alho-frito', 'Maionese Alho Frito', 2.00, true)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  active = excluded.active;

insert into products (id, name, description, base_price, active)
values
  ('extra-carne', 'Adicional de carne', 'Burger 100g adicional', 9.90, true),
  ('extra-frango', 'Adicional de frango', 'Filé de frango adicional', 9.90, true),
  ('extra-bacon', 'Adicional de bacon', 'Bacon adicional 40g', 5.90, true),
  ('extra-cheddar', 'Adicional de cheddar', 'Cheddar adicional 30g', 6.90, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  base_price = excluded.base_price,
  active = excluded.active;

insert into inventory_items (id, name, unit, quantity, min_quantity)
values ('cheddar', 'Cheddar', 'g', 3000, 500)
on conflict (id) do update set
  name = excluded.name,
  unit = excluded.unit,
  min_quantity = excluded.min_quantity;

insert into product_ingredients (product_id, inventory_item_id, quantity)
select product_id, inventory_item_id, quantity
from (
  values
    ('extra-carne', 'carne-70-30', 0.1),
    ('extra-frango', 'file-frango', 1),
    ('extra-bacon', 'bacon', 40),
    ('extra-cheddar', 'cheddar', 30)
) as seed(product_id, inventory_item_id, quantity)
where not exists (
  select 1 from product_ingredients pi
  where pi.product_id = seed.product_id
    and pi.inventory_item_id = seed.inventory_item_id
);
