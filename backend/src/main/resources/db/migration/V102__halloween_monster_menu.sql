-- Register the kiosk campaign without changing availability in other channels.
insert into products (id, name, description, base_price, active, image_url)
values ('menfis-monster', 'Menfis Monster', '130g de frango crocante, alface fresquinha, geleia de bacon agridoce e ketchup, tudo envolvido em um macio pão brioche negro. Uma combinação monstruosamente deliciosa, feita para quem tem fome de verdade.', 33.90, true, '/menu/MenfisMonster.png');

insert into pricing_products (id, code, name, category, kind, sale_price, active, notes, image_url)
select id, 'MONSTER', name, 'Especial de Halloween', 'burger', base_price, true, description, image_url
from products where id = 'menfis-monster';

insert into addons (id, name, price, active)
values ('monster-coca-zero-batata', 'Coca-Cola Zero + batata 150g', 20.90, true);
