update product_ingredients
set quantity = 0.13
where product_id in ('menfis-bacon', 'bacon-combo')
  and inventory_item_id = 'carne-70-30';

update product_ingredients
set quantity = 0.26
where product_id = 'bacon-super-combo'
  and inventory_item_id = 'carne-70-30';
