-- Halloween: Monster sandwich R$ 29,90; combo add-on (Coca-Cola Zero + batata 150g) R$ 20,90.
update products set base_price = 29.90, updated_at = now() where id = 'menfis-monster';
update pricing_products set sale_price = 29.90, original_price = null, updated_at = now() where id = 'menfis-monster';

update addons set price = 20.90 where id = 'monster-coca-zero-batata';
update products set base_price = 20.90, updated_at = now() where id = 'monster-coca-zero-batata';
update pricing_products set sale_price = 20.90, updated_at = now() where id = 'monster-coca-zero-batata';
