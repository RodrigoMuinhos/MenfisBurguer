update products
set description = 'Mirtilo e framboesa. Sabor marcante. Copo 500ml.',
    updated_at = now()
where id = 'purple-lemonade';

update pricing_products
set notes = 'Mirtilo e framboesa. Sabor marcante. Copo 500ml.',
    updated_at = now()
where id = 'purple-lemonade';
