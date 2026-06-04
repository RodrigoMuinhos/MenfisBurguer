insert into products (id, name, description, base_price, active)
values
  ('extra-maionese-barbecue', 'Maionese Barbecue', 'Porção extra de maionese barbecue', 2.00, true),
  ('extra-maionese-alho-frito', 'Maionese Alho Frito', 'Porção extra de maionese alho frito', 2.00, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  base_price = excluded.base_price,
  active = excluded.active;

insert into product_ingredients (product_id, inventory_item_id, quantity)
select product_id, inventory_item_id, quantity
from (
  values
    ('extra-maionese-barbecue', 'molho', 20),
    ('extra-maionese-alho-frito', 'molho', 20)
) as seed(product_id, inventory_item_id, quantity)
where not exists (
  select 1 from product_ingredients pi
  where pi.product_id = seed.product_id
    and pi.inventory_item_id = seed.inventory_item_id
);
