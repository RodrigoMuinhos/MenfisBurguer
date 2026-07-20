update products
set base_price = 6.90,
    updated_at = now()
where id = 'agua-com-gas';

update pricing_products
set sale_price = 6.90,
    updated_at = now()
where id = 'agua-com-gas';
