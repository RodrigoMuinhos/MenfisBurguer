update pricing_products
set sale_price = 14.90, original_price = null, updated_at = now()
where id in ('pink-lemonade', 'purple-lemonade', 'sunset-lemonade');

update products
set base_price = 14.90, updated_at = now()
where id in ('pink-lemonade', 'purple-lemonade', 'sunset-lemonade');
