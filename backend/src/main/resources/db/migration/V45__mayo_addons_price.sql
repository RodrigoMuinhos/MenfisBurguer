update products
set base_price = 2.50, updated_at = now()
where id in ('extra-maionese-barbecue', 'extra-maionese-alho-frito');

update addons
set price = 2.50
where id in ('extra-maionese-barbecue', 'extra-maionese-alho-frito');

update pricing_products
set sale_price = 2.50, updated_at = now()
where id in ('extra-maionese-barbecue', 'extra-maionese-alho-frito');
