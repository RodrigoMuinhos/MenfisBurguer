update products
set base_price = 9.90,
    updated_at = now()
where id in ('guarana', 'guarana-zero');

update pricing_products
set sale_price = 9.90,
    updated_at = now()
where id in ('guarana', 'guarana-zero');
