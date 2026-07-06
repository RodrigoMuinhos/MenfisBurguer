update pricing_products
set sale_price = 25.90,
    original_price = null,
    updated_at = now()
where id = 'burger';

update products
set base_price = 25.90,
    updated_at = now()
where id = 'burger';
