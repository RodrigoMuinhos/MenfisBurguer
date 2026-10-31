-- Halloween: Monster sandwich back to R$ 33,90 (combo add-on stays R$ 20,90).
update products set base_price = 33.90, updated_at = now() where id = 'menfis-monster';
update pricing_products set sale_price = 33.90, original_price = null, updated_at = now() where id = 'menfis-monster';
