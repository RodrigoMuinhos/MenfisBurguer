update products
set description = 'Frango grelhado 120g, cebola roxa, alface, alho frito, molho Caesar, cenoura ralada e queijo derretido.',
    updated_at = now()
where id = 'chicken-menfis-salad';

update pricing_products
set notes = 'Frango grelhado 120g, cebola roxa, alface, alho frito, molho Caesar, cenoura ralada e queijo derretido.',
    updated_at = now()
where id = 'chicken-menfis-salad';

delete from product_ingredients
where product_id = 'chicken-menfis-salad'
  and inventory_item_id in ('tomate-cereja', 'abacaxi');
