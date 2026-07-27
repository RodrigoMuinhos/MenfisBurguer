update addons
set name = 'Adicional de bacon 20g',
    price = 5.90,
    active = true
where id = 'extra-bacon';

update products
set name = 'Adicional de bacon 20g',
    description = 'Bacon adicional 20g',
    updated_at = now()
where id = 'extra-bacon';

update pricing_products
set name = 'Adicional de bacon 20g',
    notes = 'Bacon adicional 20g',
    updated_at = now()
where id = 'extra-bacon';

update product_ingredients
set quantity = 20
where product_id = 'extra-bacon'
  and inventory_item_id = 'bacon';
