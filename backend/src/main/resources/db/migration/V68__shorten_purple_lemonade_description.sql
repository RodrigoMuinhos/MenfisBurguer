update products
set description = 'Uva e amora. Copo 500ml.',
    updated_at = now()
where id = 'purple-lemonade';

update pricing_products
set notes = 'Uva e amora. Copo 500ml.',
    updated_at = now()
where id = 'purple-lemonade';
