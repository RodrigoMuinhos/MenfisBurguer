update products
set description = 'Limão Taiti e Siciliano. Sabor marcante. Copo 500ml.',
    updated_at = now()
where id = 'purple-lemonade';

update pricing_products
set notes = 'Limão Taiti e Siciliano. Sabor marcante. Copo 500ml.',
    updated_at = now()
where id = 'purple-lemonade';
