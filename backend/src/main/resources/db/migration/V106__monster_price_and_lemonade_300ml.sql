update products
set base_price = 29.90, updated_at = now()
where id = 'menfis-monster';

update pricing_products
set sale_price = 29.90, original_price = null, updated_at = now()
where id = 'menfis-monster';

update products
set base_price = 14.90,
    description = regexp_replace(description, '500\s*ml', '300ml', 'gi'),
    updated_at = now()
where id in ('pink-lemonade', 'purple-lemonade', 'sunset-lemonade');

update pricing_products
set sale_price = 14.90, original_price = null,
    notes = regexp_replace(notes, '500\s*ml', '300ml', 'gi'),
    updated_at = now()
where id in ('pink-lemonade', 'purple-lemonade', 'sunset-lemonade');
