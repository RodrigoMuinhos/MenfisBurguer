update products
set description = 'Uva e amora em uma combinação refrescante. Copo 500ml.',
    updated_at = now()
where id = 'purple-lemonade';

update pricing_products
set notes = 'Uva e amora em uma combinação refrescante. Copo 500ml.',
    updated_at = now()
where id = 'purple-lemonade';

update products
set description = 'Maracujá e manga em uma explosão tropical e refrescante. Copo 500ml.',
    updated_at = now()
where id = 'sunset-lemonade';

update pricing_products
set notes = 'Maracujá e manga em uma explosão tropical e refrescante. Copo 500ml.',
    updated_at = now()
where id = 'sunset-lemonade';
