update products
set base_price = 12.90,
    updated_at = now()
where id = 'sweet-menfis-plus';

update pricing_products
set base_cost = 4.20,
    sale_price = 12.90,
    notes = 'Caixinha com 4 doces premium por preco fixo.',
    updated_at = now()
where id = 'sweet-menfis-plus';
