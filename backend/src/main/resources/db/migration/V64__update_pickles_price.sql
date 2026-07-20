update addons
set price = 1.99,
    active = true
where id = 'extra-picles';

update products
set base_price = 1.99,
    updated_at = now()
where id = 'extra-picles';

update pricing_products
set sale_price = 1.99,
    updated_at = now()
where id = 'extra-picles';
