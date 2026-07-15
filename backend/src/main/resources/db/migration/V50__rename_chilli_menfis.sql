update products
set name = 'Chilli Menfi''s',
    description = 'Pao brioche 65g, blend bovino 130g, geleia de bacon, cheddar, farofa de Doritos, molho barbecue com alho frito e maionese Grill. Ardencia obrigatoria de 0 a 5.',
    updated_at = now()
where id = 'tropikal-barbecue';

update pricing_products
set name = 'Chilli Menfi''s',
    notes = 'Pao brioche 65g, blend bovino 130g, geleia de bacon, cheddar, farofa de Doritos, barbecue com alho frito e maionese Grill. Escolha a pimenta de 0 a 5.',
    updated_at = now()
where id = 'tropikal-barbecue';
