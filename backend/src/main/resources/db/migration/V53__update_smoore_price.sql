update products
set base_price = 21.90,
    updated_at = now()
where id = 'smash-nutella-marshmallow';

update pricing_products
set sale_price = 21.90,
    updated_at = now()
where id = 'smash-nutella-marshmallow';
