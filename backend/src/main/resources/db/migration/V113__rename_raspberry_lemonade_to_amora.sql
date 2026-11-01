update products
set name = 'Amora Lemonade',
    description = 'Amora e limão em uma combinação refrescante. Copo 300ml.',
    updated_at = now()
where id = 'raspberry-lemonade';

update pricing_products
set name = 'Amora Lemonade',
    notes = 'Amora e limão em uma combinação refrescante. Copo 300ml.',
    updated_at = now()
where id = 'raspberry-lemonade';
