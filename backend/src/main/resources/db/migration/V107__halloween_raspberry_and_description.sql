update products
set description = replace(description, 'geleia de bacon agridoce', 'geleia de bacon'), updated_at = now()
where id = 'menfis-monster';
update pricing_products
set notes = replace(notes, 'geleia de bacon agridoce', 'geleia de bacon'), updated_at = now()
where id = 'menfis-monster';

insert into products (id, name, description, base_price, active, image_url)
values ('raspberry-lemonade', 'Framboesa Lemonade', 'Framboesa e limão em uma combinação refrescante. Copo 300ml.', 14.90, true, '/Lemonade/purple.jpeg');
insert into pricing_products (id, code, name, category, kind, sale_price, active, notes, image_url)
select id, 'RASPBERRY-LEMONADE', name, 'Lemonade', 'drink', base_price, true, description, image_url
from products where id = 'raspberry-lemonade';
